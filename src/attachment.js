module.exports =
class Attachment {
    constructor(data) {
        this.id = data.id;
        this.filename = data.filename;
        this.size = data.size;
        this.url = data.url;
        this.proxy_url = data.proxy_url;
        this.height = data.height;
        this.width = data.width;
    }
};
