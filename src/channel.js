const Collection = require('./collection');
const Overwrite = require('./overwrite');

module.exports =
class Channel {
    constructor(data, client) {
        this.client = client;

        this.id = data.id;
        this.guild_id = data.id;
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

    update(new_data){
        this.name = new_data.name === "undefined" ? this.name : new_data.name;
        this.content = new_data.content === "undefined" ? this.content : new_data.content;
        this.type = new_data.type === "undefined" ? this.type : new_data.type;
        this.position = new_data.position === "undefined" ? this.position : new_data.position;
        this.is_private = new_data.is_private === "undefined" ? this.is_private : new_data.is_private;
        this.topic = new_data.topic === "undefined" ? this.topic : new_data.topic;
        this.last_message_id = new_data.last_message_id === "undefined" ? this.last_message_id : new_data.last_message_id;
        this.bitrate = new_data.bitrate === "undefined" ? this.bitrate : new_data.bitrate;

        this.permission_overwrites = new Collection();
        new_data.permission_overwrites.forEach(permission_overwrite => {
            this.permission_overwrites.add(new Overwrite(permission_overwrite));
        });
    }

    createMessage(message) {
        this.client.createMessage(this.id, message);
    }
};
