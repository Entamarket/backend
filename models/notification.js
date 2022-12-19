const database = require('../lib/database')

class Notification{
    constructor(props){
        this.props = props
    }
    save = ()=>{
        this.props.read = false
        this.props.notifiedOn = new Date().toLocaleString()

        return database.insertOne(this.props, database.collection.notifications)
    }
}

module.exports = Notification;