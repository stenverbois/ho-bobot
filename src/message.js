const Attachment = require('./attachment');
const Collection = require('./collection');
const Embed = require('./embed');
const User = require('./user');

module.exports =
class Message {
    constructor(data, author, mentions) {
        this.id = data.id;
        this.channel_id = data.channel_id;
        // Passed as arg to ensure it's the same one from the guild
        this.author = author;
        this.content = data.content;
        this.timestamp = data.timestamp;
        this.edited_timestamp = data.edited_timestamp;
        this.tts = data.tts;
        this.mention_everyone = data.mention_everyone;
        this.nonce = data.nonce;

        // Mentions passed for same reason as author
        this.mentions = mentions;

        this.attachments = new Collection();
        data.attachments.forEach(attachment => {
            this.attachments.add(new Attachment(attachment));
        });

        this.embeds = new Collection();
        data.embeds.forEach(embed => {
            this.embeds.add(new Embed(embed));
        });
    }
};
