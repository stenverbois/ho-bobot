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
const VoiceConnection = require('./voice/voiceConnection');

module.exports =
class Client extends EventEmitter {
    constructor() {
        super();
        this.botuser = undefined;

        this.token = '';
        this.gateway = '';
        this.websocket = undefined;
        this.heartbeat =  undefined;
        this.voice_heartbeat =  undefined;

        this.user_agent = {
            url: 'https://github.com/stenverbois/ho-bobot',
            version: 1
        };

        // TEMP
        this.guilds = new Collection();
        this.channels = new Collection();

        this.voice_connection = undefined;
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
        req.query({ v: 4 });
        req.query({ encoding: "json" });
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
                let message = new Message(msg_data, this);
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
                this.voice_connection = new VoiceConnection(this, msg_data.endpoint.split(":")[0], msg_data.token, msg_data.guild_id);
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
            }).catch(error => {
                if(process.env.NODE_ENV === "development") {
                    fs.appendFileSync(`failed_api.log`, JSON.stringify(error, null, 2));
                }
                return Promise.reject(`API request to ${endpoint} (${method}) failed. Logs are in 'failed_api.log' (development only).`);
            });
    }

    createMessage(channel_id, content="", tts=false) {
        let data = { content, tts };
        return this.apiRequest('POST', EndPoints.CHANNEL_MESSAGE(channel_id), data).then(msg => {
            return new Message(msg, this);
        });
    }

    editMessage(message, content="") {
        let data = { content };
        return this.apiRequest('PATCH', EndPoints.CHANNEL_MESSAGE_EDIT(message.channel_id, message.id), data);
    }

    deleteMessage(message) {
        return this.apiRequest('DELETE', EndPoints.CHANNEL_MESSAGE_EDIT(message.channel_id, message.id));
    }

    getMessages(channel_id, limit=50) {
        return this.apiRequest('GET', `${EndPoints.CHANNEL_MESSAGE(channel_id)}?limit=${limit}`);
    }
};
