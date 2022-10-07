const database = require('../lib/database')


class Reaction{
    constructor(props){
        this.props = props
    }
    save = ()=>{
        this.props.productsSold = 0
        this.props.followers = []
        this.props. products = []
        this.props.openedAt = new Date().toLocaleString()

        return database.insertOne(this.props, database.collection.reaction)
    }
}

module.exports = Reaction