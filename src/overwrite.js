module.exports =
class Overwrite {
    constructor(data) {
        this.id = data.id;
        this.type = data.type;
        this.allow = data.allow;
        this.deny = data.deny;
    }
};
