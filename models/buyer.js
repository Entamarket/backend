const utilities = require('../lib/utilities');
const database = require('../lib/database')

class Buyer{
    constructor(props, isPending){
        this.props = props;
        this.isPending = isPending;
    }
    save = (cb)=>{
        const db = database.getDatabase()
        
        if(this.isPending){
            //add indicator that shows that email is not verified
            this.props.isEmailVerified = false
            //Add date for deleting after 24 hours
            this.props.createdAt = new Date()
            //Add OTP
            this.props.otp = utilities.otpMaker()

            const collection = db.collection(database.collection.pendingBuyers)
            return collection.insertOne(this.props)  
        }
        else{
            
            this.props.joinedAt = new Date().toLocaleString()
            const collection = db.collection(database.collection.buyers)
            return collection.insertOne(this.props)
    
        }
        
        
    }
    
}

module.exports = Buyer