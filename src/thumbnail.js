module.exports =
class Thumbnail {
    constructor(data) {
        this.url = data.url;
        this.proxy_url = data.proxy_url;
        this.height = data.height;
        this.width = data.width;
    }
};
