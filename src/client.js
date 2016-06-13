const request = require('superagent')
const WebSocket = require('ws')

const User = require('./user')

const API = "https://discordapp.com/api"

module.exports =
class Client {
    constructor() {
        this.token = ''
        this.gateway = ''
        this.websocket = null
        this.heartbeat =  null

        // TEMP
        this.users = []
        this.games = {}
    }

    login(token) {
        this.token = token

        // Don't request new gateway url when we have one already
        if (this.gateway)
            return

        this.requestGateWay().then(url => {
            this.gateway = url
            this.createWebSocket(url)
        })
    }

    requestGateWay() {
        let req = request('GET', `${API}/gateway`)
        req.set('authorization', this.token)
        return req.then(res => {
            return res.body.url
        })
    }

    createWebSocket(url) {
        this.websocket = new WebSocket(url)
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
            }
            this.websocket.send(JSON.stringify(data))
        })

        this.websocket.on('error', (error) => {
            console.log(`WebSocket error: ${error}`)
        })

        this.websocket.on('close', (code, message) => {
            console.log(`WebSocket close: (${code}) ${message}`)
        })

        this.websocket.on('message', (packet, flags) => {
            if (packet instanceof Buffer) {
                const zlib = require('zlib')
                packet = zlib.inflateSync(packet).toString();
            }
            const msg = JSON.parse(packet)
            const msg_data = msg.d

            if (msg.t === 'READY') {
                this.heartbeat = setInterval(() => {
                    this.websocket.send(JSON.stringify({op: 1, d: 0}))
                }, msg_data.heartbeat_interval)
            }
            else if (msg.t === 'GUILD_CREATE') {
                msg_data.members.forEach(member => this.users.push(new User(member.user)))
            }
            else if (msg.t === 'PRESENCE_UPDATE') {
                if(msg_data.game && !this.games[msg_data.nick]) {
                    this.games[msg_data.nick] = msg_data.game.name
                    console.log(`${msg_data.nick} started playing ${msg_data.game.name}`)
                }
                else if(!msg_data.game && this.games[msg_data.nick]) {
                    console.log(`${msg_data.nick} stopped playing.`)
                }
            }
            else {
                console.log("Unknown t: " + JSON.stringify(msg.t))
            }
        })
    }
}
