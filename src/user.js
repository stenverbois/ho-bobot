module.exports =
class User {
    constructor(data) {
        this.id = data.id;
        this.username = data.username;
        this.discriminator = data.discriminator;
        this.avatar = data.avatar;
        this.verified = data.verified;
        this.email = data.email;
        this.nick = data.nick;
        this.game = data.game || null;
        this.status = data.status || "offline";
    }

    equals(other) {
        return this.id === other.id &&
               this.username === other.username &&
               this.discriminator ===  other.discriminator;
    }

    get online() {
        return this.status === "online";
    }

    update(new_data) {
        ['id', 'username', 'discriminator', 'avatar', 'verified', 'email', 'nick', 'game', 'status'].forEach(prop => {
            this[prop] = new_data[prop] === undefined ? this[prop] : new_data[prop];
        });
    }

    complete(data) {
        ['id', 'username', 'discriminator', 'avatar', 'verified', 'email', 'nick', 'game', 'status'].forEach(prop => {
            this[prop] = this[prop] !== undefined ? this[prop] : data[prop];
        });
    }
};
