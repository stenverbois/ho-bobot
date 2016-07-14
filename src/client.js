const EventEmitter = require('events').EventEmitter;
const dns = require("dns");
const fs = require('fs');
const request = require('superagent');
const udp = require("dgram");
const ws = require('ws');

const User = require('./user');
const Guild = require('./guild');
const Role = require('./role');
const Message = require('./message');
const Channel = require('./channel');
const VoiceState = require('./voicestate');
const Collection = require('./collection');
const {EndPoints, OpCodes} = require('./api');

module.exports =
class Client extends EventEmitter {
    constructor() {
        super();
        this.botuser = null;

        this.token = '';
        this.gateway = '';
        this.websocket = null;
        this.heartbeat =  null;

        this.voice_data = {};
        this.voice_socket = null;
        this.udp = null;

        this.user_agent = {
            url: 'https://github.com/stenverbois/ho-bobot',
            version: 1
        };

        // TEMP
        this.guilds = new Collection();
        this.channels = new Collection();
    }

    login(token) {
        this.token = token;

        // Don't request new gateway url when we have one already
        if (this.gateway)
            return;

        this.requestGateWay().then(url => {
            this.gateway = url;
            this.createWebSocket(url);
        });
    }

    setClientGame(name) {
        this.websocket.send(JSON.stringify({op: 3, d: {idle_since: null, game: {name: name}}}));
    }

    uptime() {
        return Date.now() - this.ready_time;
    }

    requestGateWay() {
        let req = request('GET', 'https://discordapp.com/api/gateway');
        req.set('authorization', this.token);
        return req.then(res => {
            return res.body.url;
        });
    }

    createWebSocket(url) {
        this.websocket = new ws(url);
        this.websocket.on('open', () => {
            // Send Gateway Identify message (op = 2)
            let data = {
                "op": 2,
                "d": {
                    "token": this.token,
                    "v": 4,
                    "compress": true,
                    "large_threshold": 250,
                    "properties": {
                        "$os": "linux",
                        "$browser": "",
                        "$device": "discord.js",
                        "$referrer": "",
                        "$referring_domain": ""
                    }
                }
            };
            this.websocket.send(JSON.stringify(data));
        });

        this.websocket.on('error', (error) => {
            console.log(`WebSocket error: ${error}`);
            this.login(this.token);
        });

        this.websocket.on('close', (code, message) => {
            console.log(`WebSocket close: (${code}) ${message}`);
            this.login(this.token);
        });

        this.websocket.on('message', (packet, flags) => {
            if (packet instanceof Buffer) {
                const zlib = require('zlib');
                packet = zlib.inflateSync(packet).toString();
            }
            const msg = JSON.parse(packet);

            // Log messages
            if(process.env.NODE_ENV === "development") {
                fs.appendFileSync(`${msg.t}.log`, JSON.stringify(msg, null, 2));
                fs.appendFileSync(`${msg.t}.log`, "\n-------------------------------\n");
            }

            switch(msg.op) {
                case OpCodes.DISPATCH:
                    this.processDispatch(msg);
                    break;
                default:
                    console.log(`Unexpected opcode ${msg.op}`);
            }
        });
    }

    createVoiceWebSocket(url, token, guild_id) {
        this.voice_socket = new ws("wss://" + url, { rejectUnauthorized: false });
        this.voice_socket.on('open', () => {
            // Send Voice Server Identify message (op = 0)
            let data = {
                op: 0,
                d: {
                    server_id: guild_id,
                    user_id: this.botuser.id,
                    session_id: this.botuser.voicestate.session_id,
                    token
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
            console.log(msg);

            switch(msg.op) {
                // op 2 = Ready
                // contains: ssrc, port, modes (encryption) and heartbeat_interval
                case 2:
                    // Only supported mode right now is xsalsa20_poly1305
                    let modes = msg.d.modes;

                    // IP Discovery
                    // Send 70 bytes containing only the ssrc (padded with null bytes)
                    let buff = Buffer.alloc(70);
                    buff.writeInt32LE(msg.d.ssrc);
                    this.udp.send(buff, msg.d.port, url);
                    break;
                // op 4 = Session Description
                // contains: secret_key (for use in encryption), mode (confirmation)
                case 4:
                    break;
            }
        });

        dns.lookup(url, (err, address) => {
            if (err) return console.log(err);
            console.log(address);
            this.udp = udp.createSocket("udp4");
            this.udp.bind({exclusive: true});
            this.udp.on("message", msg => {
                // let ssrc = console.log(msg.readInt32BE(0));
                // Read NULL-terminated ip
                let local_ip = msg.toString('utf8', 4, msg.length - 3);
                let local_port = msg.readUInt16LE(msg.length - 2);

                let data = {
                    op: 1,
                    d: {
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
        });

    }

    joinVoiceChannel(channel) {
        if (this.websocket) {
            let data = {
                "op": 4,
                "d": {
                    "guild_id": channel.guild_id,
                    "channel_id": channel.id,
                    "self_mute": false,
                    "self_deaf": false
                }
            };
            this.websocket.send(JSON.stringify(data));
        }
    }

    processDispatch(msg) {
        const msg_data = msg.d;
        switch(msg.t) {
            case 'READY':
                this.ready_time = Date.now();
                this.heartbeat = setInterval(() => {
                  this.websocket.send(JSON.stringify({op: 1, d: 0}));
                }, msg_data.heartbeat_interval);
                this.botuser = new User(msg_data.user);
                this.emit('ready');
                break;
            case 'CHANNEL_CREATE':
                console.log("Channel Created");
                let channel = new Channel(msg_data);
                this.guilds.get('id', msg_data.guild_id).channels.add(channel);
                this.channels.add(channel);
                this.emit('channel-created', channel);
                break;
            case 'CHANNEL_UPDATE':
                console.log("Channel Updated");
                this.channels.get("id", msg_data.id).update(msg_data);
                this.emit('channel-updated');
                break;
            case 'CHANNEL_DELETE':
                console.log("Channel Deleted");
                this.guilds.get("id", msg_data.guild_id).channels.remove("id", msg_data.id);
                this.channels.remove("id",msg_data.id);
                this.emit('channel-deleted');
                break;
            case 'GUILD_BAN_ADD':
                console.log("User Banned");
                // TODO: fix (last get returns undefined)
                //this.guilds.get("id",msg_data.guild_id).banned_users.add(this.guilds.get("id", msg_data.guild_id).get("id",msg_data.id));
                this.emit('user-banned');
                break;
            case 'GUILD_BAN_REMOVE':
                this.emit('user-unbanned');
                break;
            case 'GUILD_CREATE':
                console.log(`Guild Created: ${msg_data.name}`);
                let guild_members = new Collection();
                msg_data.members.forEach(member => {
                    // Flatten member.user into member
                    for (let attrname in member.user) { member[attrname] = member.user[attrname]; }
                    guild_members.add(new User(member));
                });
                msg_data.voice_states.forEach(voice_state => {
                    guild_members.get("id", voice_state.user_id).voicestate = new VoiceState(voice_state);
                });
                let channels = new Collection();
                msg_data.channels.forEach(channel => {
                    channel.guild_id = msg_data.id;
                    channel = new Channel(channel, this);
                    channels.add(channel);
                    this.channels.add(channel);
                });
                let server = new Guild(msg_data, guild_members, channels, this);
                // Global list updates
                this.guilds.add(server);
                this.emit('server-created', server);
                break;
            case 'GUILD_EMOJI_UPDATE':
                this.emit('server-updated');
                break;
            case 'GUILD_DELETE':
                this.emit('server-deleted');
                break;
            case 'GUILD_INTEGRATIONS_UPDATE':
                this.emit('server-updated');
                break;
            case 'GUILD_MEMBER_ADD':
                // Flatten msg_data.user into msg_data
                for (let attrname in msg_data.user) { msg_data[attrname] = msg_data.user[attrname]; }
                this.guilds.get("id",msg_data.guild_id).members.add(new User(msg_data));
                this.emit('server-member-added');
                break;
            case 'GUILD_MEMBER_REMOVE':
                this.emit('server-member-removed');
                break;
            case 'GUILD_MEMBER_UPDATE':
                for (let attrname in msg_data.user) { msg_data[attrname] = msg_data.user[attrname]; }
                this.guilds.get("id",msg_data.guild_id).members.get("id", msg_data.id).update(msg_data);
                this.emit('server-member-updated');
                break;
            case 'GUILD_MEMBERS_CHUNK':
                break;
            case 'GUILD_ROLE_CREATE':
                console.log("Guild role created");
                this.guilds.get("id",msg_data.guild_id).roles.add(new Role(msg_data.role));
                this.emit('server-role-created');
                break;
            case 'GUILD_ROLE_UPDATE':
                this.emit('server-role-updated');
                break;
            case 'GUILD_ROLE_DELETE':
                console.log("Guild role deleted");
                this.guilds.get("id",msg_data.guild_id).roles.remove("id", msg_data.role_id);
                this.emit('server-role-deleted');
                break;
            case 'MESSAGE_CREATE':
                let mentions = new Collection();
                let channel_with_message = this.channels.get("id", msg_data.channel_id);
                let guild_with_message = this.guilds.get("id", channel_with_message.guild_id);
                msg_data.mentions.forEach(mention => {
                    mentions.add(guild_with_message.get("id", mention.id));
                });
                let message = new Message(msg_data, guild_with_message.members.get("id", msg_data.author.id), mentions);
                this.emit('message-created', message);
                break;
            case 'MESSAGE_UPDATE':
                this.emit('message-updated');
                break;
            case 'MESSAGE_DELETE':
                this.emit('message-deleted');
                break;
            case 'PRESENCE_UPDATE':
                console.log("Presence Updated");
                let new_user = new User(msg_data);
                let old_user = this.guilds.get("id", msg_data.guild_id).members.replace(msg_data.user.id, new_user);
                new_user.complete(old_user);
                this.emit('presence-updated', old_user, new_user);
                break;
            case 'TYPING_START':
                this.emit('typing');
                break;
            case 'USER_SETTINGS_UPDATE':
                this.emit('settings-updated');
                break;
            case 'USER_UPDATE':
                this.emit('user-updated');
                break;
            case 'VOICE_STATE_UPDATE':
                let new_voicestate = new VoiceState(msg_data);
                let voicestate_user = this.guilds.get("id", msg_data.guild_id).members.get("id", msg_data.user_id);
                let old_voicestate = voicestate_user.voicestate;
                voicestate_user.voicestate = new_voicestate;

                // TODO: use global cache for users
                this.botuser = voicestate_user;

                this.emit('voice-state-updated', old_voicestate, new_voicestate, voicestate_user, msg_data.guild_id);
                break;
            case 'VOICE_SERVER_UPDATE':
                // hack? Appended port gives "ssl unknown protocol" error
                this.createVoiceWebSocket(msg_data.endpoint.split(":")[0], msg_data.token, msg_data.guild_id);
                this.emit('voice-server-updated');
                break;
            default:
                console.log("Unknown t: " + JSON.stringify(msg.t));
        }
    }

    apiRequest(method, endpoint, data) {
        let req = request(method, endpoint);
        req.set('User-Agent', this.user_agent)
            .set('authorization', this.token)
            .send(data);

        return req.then(result => {
                return result.body;
            }, error => {
                console.log(`API request to ${endpoint} (${method}) failed. Logs are in 'failed_api.log' (development only).`);
                if(process.env.NODE_ENV === "development") {
                    fs.appendFileSync(`failed_api.log`, JSON.stringify(error, null, 2));
                }
            });
    }

    createMessage(channel_id, message, tts=false) {
        let data = {
            'content': message,
            'tts': tts
        };
        if (data.content) {
            return this.apiRequest('POST', EndPoints.CHANNEL_MESSAGE(channel_id), data);
        }
    }

    deleteMessage(channel_id, message_id) {
        return this.apiRequest('DELETE', EndPoints.CHANNEL_MESSAGE_EDIT(channel_id, message_id));
    }

    getMessages(channel_id, limit=50) {
        return this.apiRequest('GET', `${EndPoints.CHANNEL_MESSAGE(channel_id)}?limit=${limit}`);
    }
};
