const database = require('../lib/database')


class PendingDelivery{
    constructor(props){
        this.props = props
    }
    save = ()=>{
        this.props.postedAt = new Date().toLocaleString()

        return database.insertOne(this.props, database.collection.pendingDeliveries)
    }
}

module.exports = PendingDelivery