module.exports =
class Updatable {
    constructor() {

    }

    update(new_data) {
        this.attributes.forEach( attrname => {
            this[attrname] = new_data[attrname] === undefined ? this[attrname] : new_data[attrname];
        });
    }

    complete(new_data) {
        this.attributes.forEach( attrname => {
            this[attrname] = this[attrname] !== undefined ? this[attrname] : new_data[attrname];
        });
    }

};
