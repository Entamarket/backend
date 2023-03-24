const database = require('../lib/database')


class SoldProduct{
    constructor(props){
        this.props = props
    }
    save = ()=>{
        this.props.soldAt = new Date().toLocaleString()

        return database.insertOne(this.props, database.collection.soldProducts)
    }
}

module.exports = SoldProduct