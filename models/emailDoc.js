const database = require('../lib/database')

class EmailDoc{
    constructor(props){
        this.props = props
    }
    save = ()=>{
        
        this.props.addedOn = new Date().toLocaleString()

        return database.insertOne(this.props, database.collection.emailList)
    }
}

module.exports = EmailDoc;