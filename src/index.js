
import dotenv from "dotenv"
import connectDB from "./db/index.js";


dotenv.config({
    path: './env'
})

connectDB()









/*
import express from "express"
const app = express()
//function connectDB(){}

//connectDB()

// talk to database use tyrcatch
;(async ()=>{
    try {
        await mongoose.connect(`${process.env.MANGODB_URI}/${DB_NAME}`)
        app.on("error", (error)=>{
            console.log("ERROR:",error);
            throw error
        })

        app.listen(process.env,()=>{
            console.log(`App is listening on port ${process.env.PORT}`);
        })
    } catch (error) {
        console.error("ERROR :", error)
        throw err
    }

})  ()

*/