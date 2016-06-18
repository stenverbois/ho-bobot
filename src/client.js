const fs = require('fs');
const EventEmitter = require('events').EventEmitter;
const request = require('superagent');
const WebSocket = require('ws');

const User = require('./user');
const Guild = require('./guild');
const Role = require('./role');
const Message = require('./message');
const Channel = require('./channel');
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

            // Log messages
            fs.appendFileSync(`${msg.t}.log`, JSON.stringify(msg, null, 2));
            fs.appendFileSync(`${msg.t}.log`, "\n-------------------------------\n");

            switch(msg.t) {
                case 'READY':
                    console.log("Ready");
                    this.heartbeat = setInterval(() => {
                      this.websocket.send(JSON.stringify({op: 1, d: 0}));
                    }, msg_data.heartbeat_interval);
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
                    let members = [];
                    msg_data.members.forEach(member => {
                        members.push(new User(member.user));
                    });
                    let guild_members = new Collection();
                    guild_members.add(members);
                    let channels = [];
                    msg_data.channels.forEach(channel => {
                        channel.guild_id = msg_data.id;
                        channels.push(new Channel(channel, this));
                    });
                    let server = new Guild(msg_data, guild_members, channels, this);
                    // Global list updates
                    this.channels.add(channels);
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
                    this.guilds.get("id",msg_data.guild_id).members.add(new User(msg_data.user));
                    this.emit('server-member-added');
                    break;
                case 'GUILD_MEMBER_REMOVE':
                    this.emit('server-member-removed');
                    break;
                case 'GUILD_MEMBER_UPDATE':
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
                    console.log("Message Created");
                    let mentions = new Collection();
                    let channel_with_message = this.channels.get("id", msg_data.channel_id);
                    let guild_with_message = this.guilds.get("id", channel_with_message.guild_id);
                    msg_data.mentions.forEach(mention => {
                        mentions.add(guild_with_message.get("id", mention.id));
                    });
                    let message = new Message(msg_data, guild_with_message.members.get("id", msg_data.author.id), mentions);
                    // TODO: do something with message
                    this.emit('message-created');
                    break;
                case 'MESSAGE_UPDATE':
                    this.emit('message-updated');
                    break;
                case 'MESSAGE_DELETE':
                    this.emit('message-deleted');
                    break;
                case 'PRESENCE_UPDATE':
                    // TODO: test
                    console.log("Presence Updated");
                    this.guilds.get("id", msg_data.guild_id).members.get("id", msg_data.id).update(msg_data);
                    this.emit('presence-updated');
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
                    this.emit('voice-state-updated');
                    break;
                case 'VOICE_SERVER_UPDATE':
                    this.emit('voice-server-updated');
                    break;
                default:
                    console.log("Unknown t: " + JSON.stringify(msg.t));
                }
            }
        );
    }

    apiRequest(method, endpoint, data) {
        let req = request(method, endpoint);
        req.set('User-Agent', this.user_agent)
            .set('authorization', this.token)
            .send(data);

        return req.then(result => {
                return result.body;
            }, error => {
                console.log(`API request to ${endpoint} (${method}) failed. Logs are in 'failed_api.log'.`);
                fs.writeFileSync(`failed_api.log`, JSON.stringify(error, null, 2));
            });
    }

    createMessage(channel_id, message) {
        let data = {
            'content': message
        };
        return this.apiRequest('POST', EndPoints.CHANNEL_MESSAGE(channel_id), data);
    }
};
