module.exports =
class Collection {
    constructor() {
        this.collection = {}
    }

    get(id) {
        return this.collection[id]
    }

    add(item) {
        this.collection[item.id] = item
    }

    all() {
        let arr = []
        for(var item in this.collection) {
            arr.push(this.collection[item]);
        }
        return arr
    }
}
