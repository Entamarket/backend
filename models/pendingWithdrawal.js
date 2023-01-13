const database = require('../lib/database')

class PendingWithdrawal{
    constructor(props){
        this.props = props
    }
    save = ()=>{
        this.props.notifiedOn = new Date().toLocaleString()

        return database.insertOne(this.props, database.collection.pendingWithdrawals)
    }
}

module.exports = PendingWithdrawal;