const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({

    name: {
        type: String,
        max: 30,
        
    },
    password: {
        type: String,
        required: true,
        min: 8,

    }
    ,
    createdAt: {
        type: Date,
        default: Date.now,

    }
})

 const User = mongoose.model('User',userSchema)

module.exports = User