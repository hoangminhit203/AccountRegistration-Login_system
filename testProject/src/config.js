const mongoose = require("mongoose")
const connect = mongoose.connect("mongodb://localhost:27017/Login")

//check database is connected ??
connect
  .then(() => {
    console.log("Database connected successfully")
  })
  .catch(() => {
    console.log("Database can't be connected")
  })

//create a schema
const LoginSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: false,
  },
  activationToken: {
    type: String,
    default: null,
  },
})

//collection part
const collection = new mongoose.model("users", LoginSchema)

module.exports = collection
