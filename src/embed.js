const Thumbnail = require('./thumbnail');
const Provider = require('./provider');

module.exports =
class Embed {
    constructor(data) {
        this.title = data.title;
        this.type = data.type;
        this.description = data.description;
        this.url = data.url;
        this.thumbnail = new Thumbnail(data.thumbnail);
        this.provider = new Provider(data.provider);
    }
};
