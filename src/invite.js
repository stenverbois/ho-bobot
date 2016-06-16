module.exports =
class Invite {
    constructor(data) {
        this.code = data.code;
        this.server = data.server;
        this.channel = data.channel;
        this.xkcdpass = data.xkcdpass;
    }
};
