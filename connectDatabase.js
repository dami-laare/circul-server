const mongoose = require('mongoose');

module.exports = () => {
    mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true, 
        useUnifiedTopology: true
    }).then(con => {
        console.log(`Successfully connected to MongoDb with HOST: ${con.connection.host}`)
    }).catch(err => {
        console.log(err);
    })

}