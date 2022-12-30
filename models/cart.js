const database = require('../lib/database')


class Cart{
    constructor(props){
        this.props = props
    }
    save = ()=>{
        this.props.postedAt = new Date().toLocaleString()
        this.props.products = []

        return database.insertOne(this.props, database.collection.carts)
    }
}

module.exports = Cart