const Provider = require('./provider');
const Collection = require('./collection');

module.exports =
class Emoji {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.require_colons = data.require_colons;
        this.managed = data.managed;

        this.roles = Collection();
        data.roles.forEach(role => {
            this.roles.add(new Role(role));
        });
    }
};
