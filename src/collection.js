module.exports =
class Collection {
    constructor() {
        this.collection = {};
    }

    get(key, value) {
        for (var item in this.collection) {
            if (this.collection[item][key] === value) {
                return this.collection[item];
            }
        }
    }

    all(key, value) {
        let results = [];
        for (var item in this.collection) {
            if (key === 'undefined' || this.collection[item][key] === value) {
                results.push(this.collection[item]);
            }
        }
        return results;
    }

    add(item) {
        if (item instanceof Array) {
            item.forEach(element => {
                this.add(element);
            });
        }
        else {
            this.collection[item.id] = item;
        }
    }

    remove(key, value) {
        //TODO: assume there could be multiple?
        for (var item in this.collection) {
            if (this.collection[item][key] === value) {
                delete this.collection[item];
            }
        }
    }

    replace(id, item) {
        let old = this.collection[id];
        this.collection[id] = item;
        return old;
    }
};
