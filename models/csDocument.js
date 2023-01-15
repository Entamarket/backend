const database = require('../lib/database')


class CSDocument{
    constructor(props){
        this.props = props
    }
    save = ()=>{
        this.props.postedAt = new Date().toLocaleString()

        return database.insertOne(this.props, database.collection.CSDocuments)
    }
}

module.exports = CSDocument