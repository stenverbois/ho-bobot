const Collection = require('./collection');

module.exports =
class Channel {
    constructor(data) {
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

        this.permission_overwrites = Collection();
        data.permission_overwrites.forEach(permission_overwrite => {
            this.permission_overwrites.add(new Overwrite(permission_overwrite));
        });
    }
};
