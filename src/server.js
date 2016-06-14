const Collection = require('./collection')
const User = require('./user')

module.exports =
class Server {
    constructor(data) {
        this.id = data.id
        this.name = data.name
        this.icon = data.icon
        this.splash = data.splash
        this.owner_id = data.owner_id
        this.region = data.region
        this.afk_channel_id = data.afk_channel_id
        this.afk_timeout = data.afk_timeout
        this.embed_channel_id = data.embed_channel_id
        this.verification_level = data.verification_level
        this.voice_states = data.voice_states
        this.roles = data.roles
        this.emojis = data.emojis
        this.features = data.features

        this.members = new Collection()
        data.members.forEach(member => {
            this.members.add(new User(member.user))
        })

        data.presences.forEach(presence => {
            this.members.get("id", presence.user.id).status = presence.status
        })
    }
}
