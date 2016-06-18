const Collection = require('./collection');
const User = require('./user');
const Role = require('./role');
const Channel = require('./channel');
const VoiceState = require('./voicestate');
const Emoji = require('./emoji');

module.exports =
class Guild {
    constructor(data, members, channels) {
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

        this.banned_users = new Collection();

        // Channel objects created in Client
        this.channels = channels;

        // User objects created in Client
        this.members = members;

        this.voice_states = new Collection();
        data.voice_states.forEach(voice_state => {
            this.voice_states.add(new VoiceState(voice_state));
        });

        this.emojis = new Collection();
        data.emojis.forEach(emoji => {
            this.emojis.add(new Emoji(emoji));
        });

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
