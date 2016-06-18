const Collection = require('./collection');
const User = require('./user');

module.exports =
class Message {
    constructor(data, author) {
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

        this.mentions = Collection();

        this.attachments = Collection();

        this.embeds = Collection();
    }
};
