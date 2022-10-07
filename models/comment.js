const database = require('../lib/database')


class Comment{
    constructor(props){
        this.props = props
    }
    save = ()=>{
        this.props.postedAt = new Date().toLocaleString()

        return database.insertOne(this.props, database.collection.comments)
    }
}

module.exports = Comment