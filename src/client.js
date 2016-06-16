const fs = require('fs');
const EventEmitter = require('events').EventEmitter;
const request = require('superagent');
const WebSocket = require('ws');

const User = require('./user');
const Server = require('./server');
const Collection = require('./collection');
const EndPoints = require('./api').EndPoints;

module.exports =
class Client extends EventEmitter {
    constructor() {
        super();
        this.token = '';
        this.gateway = '';
        this.websocket = null;
        this.heartbeat =  null;

        // TEMP
        this.servers = new Collection();
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

    requestGateWay() {
        let req = request('GET', 'https://discordapp.com/api/gateway');
        req.set('authorization', this.token);
        return req.then(res => {
            return res.body.url;
        });
    }

    createWebSocket(url) {
        this.websocket = new WebSocket(url);
        this.websocket.on('open', () => {
            // Send Gateway Identify message (op = 2)
            let data = {
                "op": 2,
                "d": {
                    "token": this.token,
                    "v": 3,
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
        });

        this.websocket.on('close', (code, message) => {
            console.log(`WebSocket close: (${code}) ${message}`);
        });

        this.websocket.on('message', (packet, flags) => {
            if (packet instanceof Buffer) {
                const zlib = require('zlib');
                packet = zlib.inflateSync(packet).toString();
            }
            const msg = JSON.parse(packet);
            const msg_data = msg.d;


            if (msg.t === 'READY') {
                this.heartbeat = setInterval(() => {
                    this.websocket.send(JSON.stringify({op: 1, d: 0}));
                }, msg_data.heartbeat_interval);

                this.emit('ready');
            }
            else if (msg.t === 'GUILD_CREATE') {
                let server = new Server(msg_data);
                this.servers.add(server);
                this.emit('server-created', server);
                let test_str = "Members online: ";
                this.servers.get("id", msg_data.id).members.all("online", true).forEach(member => {
                    console.log(member.status);
                    test_str += member.username + ", ";
                });
                console.log(test_str.substring(0, test_str.length - 2));
                if (msg_data.name === "Ho-BoBot Testing Grounds") {
                    let req = request('POST', EndPoints.CHANNEL_MESSAGE(msg_data.id));
                    req.set('User-Agent', {url:"https://github.com/stenverbois/ho-bobot", version: 1})
                       .send({'content': test_str.substring(0, test_str.length - 2)})
                       .set('authorization', this.token)
                       .then(res => {
                        // console.log(res)
                    });
                }

            }
            else if (msg.t === 'PRESENCE_UPDATE') {
                // Log messages
                fs.appendFileSync(`${msg.t}.log`, JSON.stringify(msg, null, 2));
                fs.appendFileSync(`${msg.t}.log`, "\n-------------------------------\n");
                if (msg_data.game && !this.games[msg_data.nick]) {
                    this.games[msg_data.nick] = msg_data.game.name;
                    console.log(`${msg_data.nick} started playing ${msg_data.game.name}`);
                }
                else if (!msg_data.game && this.games[msg_data.nick]) {
                    console.log(`${msg_data.nick} stopped playing.`);
                }
            }
            else {
                // Log messages
                fs.appendFileSync(`${msg.t}.log`, JSON.stringify(msg, null, 2));
                fs.appendFileSync(`${msg.t}.log`, "\n-------------------------------\n");
                console.log("Unknown t: " + JSON.stringify(msg.t));
            }
        });
    }
};
