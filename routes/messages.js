const mongoose = require("mongoose")

const messageSchema = mongoose.Schema({
    sender: String,
    receiver: String,
    message: String,
    sent: {
        type: Boolean,
        default: false
    },
    date: {
        type: Date,
        default: Date.now()
    }   

})

module.exports = mongoose.model("messages",messageSchema)