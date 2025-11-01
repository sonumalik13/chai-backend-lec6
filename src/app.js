import express from "import";
import cors from "cors";
import cookieParser from "cookie-parser";



const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))  //ye configration isliye hai ki jab bhi kuch search karte hai chai aur code isko decode karne ke liye use karte hai-->chai+aur+code
app.use(express.static("public"))
app.use(cookieParser())

export { app }