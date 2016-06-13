module.exports =
class User {
    constructor(data) {
        this.id = data.id
        this.username = data.username
        this.discriminator = data.discriminator
        this.avatar = data.avatar
        this.verified = data.verified
        this.email = data.email
    }
}
