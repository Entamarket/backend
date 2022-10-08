const database = require('../lib/database')


class Reaction{
    constructor(props){
        this.props = props
    }
    save = ()=>{
        
        this.props.reactedAt = new Date().toLocaleString()

        return database.insertOne(this.props, database.collection.reactions)
    }
}

module.exports = Reaction