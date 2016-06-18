const Collection = require('./collection');
const User = require('./user');
const Role = require('./role');
const Channel = require('./channel');

module.exports =
class Guild {
    constructor(data, members) {
        this.id = data.id;
        this.name = data.name;
        this.icon = data.icon;
        this.splash = data.splash;
        this.owner_id = data.owner_id;
        this.region = data.region;
        this.afk_channel_id = data.afk_channel_id;
        this.afk_timeout = data.afk_timeout;
        this.embed_channel_id = data.embed_channel_id;
        this.verification_level = data.verification_level;
        this.features = data.features;

        // User objects created in Client
        this.members = members;

        this.channels = new Collection();
        data.channels.forEach(channel => {
            this.channels.add(new Channel(channel));
        });

        // TODO: voice state object
        this.voice_states = new Collection();
        // TODO: emoji objects
        this.emojis = new Collection();

        this.roles = new Collection();
        data.roles.forEach(role => {
            this.roles.add(new Role(role));
        });

        data.presences.forEach(presence => {
            let user = this.members.get("id", presence.user.id);
            user.status = presence.status;
            if (presence.game) {
                user.game = presence.game;
            }
        });
    }
};
