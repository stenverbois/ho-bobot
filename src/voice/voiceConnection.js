const EventEmitter = require('events').EventEmitter;
const ws = require('ws');
const dns = require("dns");
const udp = require("dgram");

const nacl = require('tweetnacl');
const opus = require('node-opus');

class VoiceConnection extends EventEmitter {
    constructor(client, endpoint, token, guild_id) {
        super();

        this.client = client;
        this.voice_data = {};
        this.voice_socket = undefined;
        this.udp = undefined;
        // temp
        this.udp_port = 0;
        this.udp_url = endpoint;
        this.udp_ssrc = 0;
        this.secret_key = undefined;
        this.udp_done = false;
        this.opus = new opus.OpusEncoder(48000, 2);
        this.sequence = 0;
        this.timestamp = 0;
        this.start_time = undefined;

        this.stream_playing = undefined;

        this.createVoiceWebSocket(endpoint, token, guild_id);
    }

    play(url) {
        // A stream is already playing, stop it first
        // TODO: support song queueing
        if (this.stream_playing) {
            this.stop();
        }

        this.stream_playing = this.streamFile(url);
        let audio_stream = this.stream_playing.stdout;
        audio_stream.once("readable", () => {
            this.start_time = Date.now();
            this.sendStream(audio_stream);
        });
    }

    stop() {
        if (!this.stream_playing)
            return;

        this.stream_playing.kill();
        this.stream_playing = undefined;
    }

    createVoiceWebSocket(url, token, guild_id, session_id) {
        dns.lookup(url, (err, address) => {
            if (err) return console.log(err);
            this.voice_socket = new ws("wss://" + url, { rejectUnauthorized: false });
            this.udp = udp.createSocket("udp4");
            this.udp.bind({exclusive: true});
            this.udp.once("message", msg => {
                // let ssrc = console.log(msg.readInt32BE(0));
                // Read NULL-terminated ip
                let local_ip = msg.toString('utf8', 4, msg.length - 3);
                let local_port = msg.readUInt16LE(msg.length - 2);

                let data = {
                    "op": 1,
                    "d": {
                        "protocol": "udp",
                        "data": {
                            "address": local_ip,
                            "port": local_port,
                            "mode": "xsalsa20_poly1305"
                        }
                    }
                };
                this.voice_socket.send(JSON.stringify(data));
            });

            this.voice_socket.on('open', () => {
                // Send Voice Server Identify message (op = 0)
                let data = {
                    op: 0,
                    d: {
                        server_id: guild_id,
                        user_id: this.client.botuser.id,
                        session_id: this.client.botuser.voicestate.session_id,
                        token: token
                    }
                };
                this.voice_socket.send(JSON.stringify(data));
            });

            this.voice_socket.on('error', (error) => {
                console.log(`Voice WebSocket error: ${error}`);
            });

            this.voice_socket.on('close', (code, message) => {
                console.log(`Voice WebSocket close: (${code}) ${message}`);
            });

            this.voice_socket.on('message', (packet, flags) => {
                const msg = JSON.parse(packet);

                switch(msg.op) {
                    // op 2 = Ready
                    // contains: ssrc, port, modes (encryption) and heartbeat_interval
                    case 2:
                        // Only supported mode right now is xsalsa20_poly1305
                        let modes = msg.d.modes;

                        // IP Discovery
                        // Send 70 bytes containing only the ssrc (padded with null bytes)
                        let buff = Buffer.alloc(70);
                        this.udp_ssrc = msg.d.ssrc;
                        buff.writeInt32LE(this.udp_ssrc);
                        this.udp_port = msg.d.port;
                        this.udp.send(buff, this.udp_port, this.udp_url);

                        // Heartbeat
                        this.voice_heartbeat = setInterval(() => {
                            this.voice_socket.send(JSON.stringify({ "op": 3, "d": null }));
                        }, msg.d.heartbeat_interval);
                        break;
                    // Heartbeats trigger responses for some reason
                    case 3:
                        break;
                    // op 4 = Session Description
                    // contains: secret_key (for use in encryption), mode (confirmation)
                    case 4:
                        this.secret_key = Buffer.from(msg.d.secret_key);
                        let data = {
                            op: 5,
                            d: {
                                speaking: true,
                                delay: 0
                            }
                        };
                        this.voice_socket.send(JSON.stringify(data));
                        break;

                    case 5:
                        // We don't care about speaking updates just yet
                        break;
                    default:
                        console.log(`Unknown opcode ${msg.op}: `, msg);
                }
            });
        });
    }

    // TODO: Refactor/move
    streamFile(file) {
        const rate = 48000;
        const audio_channels = 2;
        const format = "s16le";

        const subprocess = require('child_process');

        let command = "ffmpeg";
        let options = ["-i", file, "-f", format, "-ar", rate, "-ac", audio_channels, "pipe:1"];
        let child = subprocess.spawn(command, options, {stdio: ['pipe', 'pipe', 'ignore']});
        child.on("error", (err) => {
            console.log(err);
        });
        return child;
    }

    sendStream(stream) {
        // Buffer is zero filled by default
        let done = false;
        stream.on("end", () => {
            done = true;
            console.log("File is done streaming");
        });
        stream.on("close", () => {
            done = true;
            console.log("File stopped streaming");
        });

        let _sendStream = (stream, cnt) => {
            if(done) return;
            let buffer = stream.read(1920 * 2);
            let encoded = (buffer && buffer.length === 1920 * 2) ? this.opus.encode(buffer) : Buffer.from([0xF8, 0xFF, 0xFE]);
            return setTimeout(() => {
                this.sendPacket(encoded);
                _sendStream(stream, cnt + 1);
            }, 20 + ((this.start_time + cnt * 20) - Date.now()));
        };
        _sendStream(stream, 1);
    }

    sendPacket(encoded) {
        this.sequence = this.sequence < 0xFFFF ? this.sequence + 1 : 0;
        this.timestamp = this.timestamp < 0xFFFFFFFF ? this.timestamp + 960 : 0;

        let header = Buffer.alloc(24);
        header[0] = 0x80;  // Type
        header[1] = 0x78;  // Version
        header.writeUIntBE(this.sequence, 2, 2);  // Sequence
        header.writeUIntBE(this.timestamp, 4, 4);  // Timestamp
        header.writeUIntBE(this.udp_ssrc, 8, 4);  // SSRC
        let encrypted = nacl.secretbox(encoded, header, this.secret_key);
        let packet = Buffer.alloc(12 + encrypted.length);
        // Copy header into packet
        header.copy(packet, 0, 0, 12);
        // Copy encrypted into packet after header
        for (let i = 0; i < encrypted.length; i++) packet[i + 12] = encrypted[i];

        this.udp.send(packet, this.udp_port, this.udp_url);
    }

}

module.exports = VoiceConnection;
