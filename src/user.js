const VoiceState = require('./voicestate');
const Updatable = require('./updatable');

module.exports =
class User extends Updatable {
    constructor(data) {
        super();
        this.id = data.id;
        this.username = data.username;
        this.discriminator = data.discriminator;
        this.avatar = data.avatar;
        this.verified = data.verified;
        this.email = data.email;
        this.nick = data.nick;
        this.game = data.game || null;
        this.status = data.status || "offline";
        let default_data = {};
        this.voicestate = new VoiceState(default_data);
    }

    equals(other) {
        return this.id === other.id &&
               this.username === other.username &&
               this.discriminator ===  other.discriminator;
    }

    get online() {
        return this.status === "online";
    }
    
    get attributes() {
        return ["username", "discriminator", "avatar", "verified", "email", "nick", "game", "status"];
    }
};
