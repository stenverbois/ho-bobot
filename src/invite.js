module.exports =
class Invite {
    constructor(data) {
        this.code = data.code;
        this.guild = data.guild;
        this.channel = data.channel;
        this.xkcdpass = data.xkcdpass;
    }
};
