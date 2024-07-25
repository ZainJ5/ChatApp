require('dotenv').config();
const mongoose = require('mongoose');
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

const userSchema = mongoose.Schema({
  username:{
    type: String,
    required: true
  },
  password:{
    type: String,
    required: true
  },
  email:{
    type: String,
    required: true,
    unique: true
  },
  SocketId:{
    type: String,
    default: null
  },
  image:{
    type: String,
    default: '/images/defaultimg.jpg'
  }
})


module.exports = mongoose.model('userdata',userSchema)