import exp from 'express'
import mongoose from 'mongoose'
import { config } from 'dotenv'
import userApp from './APIs/UserApi.js'
import cors from 'cors'
config()
const app=exp()

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173']

app.use(cors({
    origin: allowedOrigins
}))

app.use(exp.json())
app.use('/user-api',userApp)

// DB connection with caching for serverless
let isConnected = false
const connectDB = async () => {
    if (isConnected) return
    try {
        await mongoose.connect(process.env.db_url)
        isConnected = true
        console.log('DB connected')
    } catch (e) {
        console.log('failed to connect db:', e.message)
        throw e
    }
}

// For local development
if (process.env.NODE_ENV !== 'production') {
    const port = process.env.port || 4000
    connectDB().then(() => {
        app.listen(port, () => {
            console.log('server started on port', port)
        })
    })
}

// For Vercel serverless
export { app, connectDB }


//error handling middleware
app.use((err,req,res,next)=>{
   if(err.name==="ValidationError"){
    return res.status(400).json({message:"validation failes"})
   }
   if(err.name==="CastError"){
    return res.status(400).json({message:"invalid id"})
   }
    if(err.code===11000){
        return res.status(409).json({message:"duplicate key error"})
    }
    res.status(500).json({message:"internal server error"})
})