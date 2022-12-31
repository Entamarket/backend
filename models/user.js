const database = require('../lib/database')

class User{
    constructor(props){
        this.props = props;
    }
    save = ()=>{
        
        this.props.joinedAt = new Date().toLocaleString()

        return database.insertOne(this.props, database.collection.users)
    }
}

module.exports = User