const database = require('../lib/database')

class Receipt{
    constructor(props){
        this.props = props

    }
    save = ()=>{
        this.props.postedAt = new Date().toLocaleString()

        return database.insertOne(this.props, database.collection.receipts)
    }
}

module.exports = Receipt