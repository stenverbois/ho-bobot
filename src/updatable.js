module.exports =
class Updatable {
    constructor() {

    }
    update(new_data){
        for (var attrname in this) {
            this[attrname] = new_data[attrname] === undefined ? this[attrname] : new_data[attrname];
        }
    }
    
    complete(new_data){
        for (var attrname in this) {
            this[attrname] = new_data[attrname] !== undefined ? this[attrname] : new_data[attrname];
        }
    }

};
