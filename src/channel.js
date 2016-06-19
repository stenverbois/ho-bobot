const Collection = require('./collection');
const Overwrite = require('./overwrite');
const Updatable = require('./updatable');

module.exports =
class Channel extends Updatable {
    constructor(data, client) {
        super();
        this.client = client;

        this.id = data.id;
        this.guild_id = data.guild_id;
        this.name = data.name;
        this.content = data.content;
        this.type = data.type;
        this.position = data.position;
        this.is_private = data.is_private;
        this.topic = data.topic;
        this.last_message_id = data.last_message_id;
        this.bitrate = data.bitrate;

        this.permission_overwrites = new Collection();
        data.permission_overwrites.forEach(permission_overwrite => {
            this.permission_overwrites.add(new Overwrite(permission_overwrite));
        });
    }

    createMessage(message) {
        this.client.createMessage(this.id, message);
    }
    get attributes() {
        return ["guild_id", "name", "content", "type", "position", "is_private", "topic", "last_message_id", "bitrate"];
    }
};
