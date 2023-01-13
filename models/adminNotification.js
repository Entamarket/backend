const database = require('../lib/database')

class AdminNotification{
    constructor(props){
        this.props = props
    }
    save = ()=>{
        this.props.read = false
        this.props.notifiedOn = new Date().toLocaleString()

        return database.insertOne(this.props, database.collection.adminNotifications)
    }
}

module.exports = AdminNotification;