module.exports =
class User {
    constructor(data) {
        this.id = data.id
        this.username = data.username
        this.discriminator = data.discriminator
        this.avatar = data.avatar
        this.verified = data.verified
        this.email = data.email
        this.nick = this.nick
        this.game = this.game

        this.status = "offline"
    }

    equals(other) {
        return this.id === other.id &&
               this.username === other.username &&
               this.discriminator ===  other.discriminator
    }

    get online() {
        return this.status === "online"
    }
}
