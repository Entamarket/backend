const mongo = require('../lib/database')

class Trader{
    constructor(props, isPending){
        this.props = props;
        this.isPending = isPending;
    }
    save = (cb)=>{
        const db = mongo.getDatabase()
        
        if(this.isPending){
            const collection = db.collection(mongo.collection.pendingTraders)
            return collection.insertOne(this.props)
        }
        else{
            this.props.shops = []
            this.props.tokens = []
            const collection = db.collection(mongo.collection.traders)
            return collection.insertOne(this.props)
    
        }
        
        
    }
}

module.exports = Trader