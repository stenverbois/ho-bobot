module.exports =
class Collection {
    constructor() {
        this.collection = {}

        get(id) {
            return this.collection[id]
        }

        add(item) {
            this.collection[item.id] = item
        }
    }
}
