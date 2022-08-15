const database = require('../lib/database')

class Product{
    constructor(props){
        this.props = props
    }
    save = ()=>{
        this.props.comments = []
        this.props.reactions = []
        this.props.addedAt = new Date().toLocaleString()

        return database.insertOne(this.props, database.collection.products)
    }
}

module.exports = Product;