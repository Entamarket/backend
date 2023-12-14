const database = require('../lib/database')


class BoughtProduct{
    constructor(props){
        this.props = props
    }
    save = ()=>{
        this.props.date = new Date().toLocaleString()

        return database.insertOne(this.props, database.collection.boughtProducts)
    }
}

module.exports = BoughtProduct