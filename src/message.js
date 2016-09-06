const Attachment = require('./attachment');
const Collection = require('./collection');
const Embed = require('./embed');
const User = require('./user');

module.exports =
class Message {
    constructor(data, client) {
        this.client = client;

        this.id = data.id;
        this.channel_id = data.channel_id;

        let channel = client.channels.get("id", data.channel_id);
        let guild = client.guilds.get("id", channel.guild_id);
        this.author = guild.members.get("id", data.author.id);
        this.content = data.content;
        this.timestamp = data.timestamp;
        this.edited_timestamp = data.edited_timestamp;
        this.tts = data.tts;
        this.mention_everyone = data.mention_everyone;
        this.nonce = data.nonce;

        this.mentions = new Collection();
        data.mentions.forEach(mention => {
            this.mentions.add(guild.get("id", mention.id));
        });

        this.attachments = new Collection();
        data.attachments.forEach(attachment => {
            this.attachments.add(new Attachment(attachment));
        });

        this.embeds = new Collection();
        data.embeds.forEach(embed => {
            this.embeds.add(new Embed(embed));
        });
    }

    delete() {
        return this.client.deleteMessage(this);
    }

    edit(content) {
        return this.client.editMessage(this, content);
    }
};
