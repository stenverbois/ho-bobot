const Collection = require('./collection');
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

        this.mentions = mentions;

        this.attachments = Collection();
        data.attachments.forEach(attachment => {
            this.attachments.add(new Attachment(attachment));
        });

        this.embeds = Collection();
        data.embeds.forEach(embed => {
            this.embeds.add(new Embed(embed));
        });
    }
};
