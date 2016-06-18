module.exports =
class Role {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.color = data.color;
        this.hoist = data.hoist;
        this.position = data.position;
        this.permissions = data.permissions;
        this.managed = this.managed;
        this.mentionable = this.mentionable;
    }
};
