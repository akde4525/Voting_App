const mongoose = require('mongoose')

mongoose.connect("mongodb://localhost:27017/voting")

const db = mongoose.connection

db.on("error", (err) => {
    console.log("Error while connecting to DB.")
});
db.on("disconnected", () => {
    console.log("mongo disconnected.")
});
db.once("open", () => {
    console.log("Connected to mongoDB")
});

module.exports = db;