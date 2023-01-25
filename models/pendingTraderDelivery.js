const database = require('../lib/database')


class PendingTraderDelivery{
    constructor(props){
        this.props = props
    }
    save = ()=>{
        this.props.postedAt = new Date().toLocaleString()

        return database.insertOne(this.props, database.collection.pendingTradersDeliveries)
    }
}

module.exports = PendingTraderDelivery