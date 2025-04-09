import 'express-async-errors'
import * as dotenv from 'dotenv'
dotenv.config()

import express from 'express'
const app = express()

import { readFile } from 'fs/promises'
import morgan from 'morgan'
import mongoose from 'mongoose'
import helmet from 'helmet'
import mongoSanitize from 'express-mongo-sanitize'

import jobRouter from './routes/jobRouter.js'
import authRouter from './routes/authRouter.js'
import userRouter from './routes/userRouter.js'

import errorHandlerMiddleware from './middleware/errorHandlerMiddleware.js'
import { authenticateUser } from './middleware/authMiddleware.js'
import cookieParser from 'cookie-parser'

import { dirname } from 'path'
import { fileURLToPath } from 'url'
import path from 'path'

import cloudinary from 'cloudinary'

const __dirname = dirname(fileURLToPath(import.meta.url))

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
})

app.use(express.static(path.resolve(__dirname, '../client/dist')))

// before anything else, so the environment variables are loaded properly
// initialize dotenv to load environment variables

// Middleware for logging HTTP requests
app.use(morgan('dev'))

// Middleware to parse incoming JSON request bodies
app.use(express.json())

app.use(cookieParser())
app.use(helmet())
app.use(mongoSanitize())

app.use('/api/v1/jobs', authenticateUser, jobRouter)
app.use('/api/v1/auth', authRouter)
app.use('/api/v1/users', authenticateUser, userRouter)

app.use(errorHandlerMiddleware)

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../client/dist', 'index.html'))
})

// Set the port from environment variables or default to 5100
const port = process.env.PORT || 5100

// Wrap the mongoose connection and app.listen inside an async function
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL)
    app.listen(port, () => {
      console.log(`Server running on PORT ${port}....`)
    })
  } catch (error) {
    console.error('Error connecting to MongoDB:', error)
    process.exit(1)
  }
}

startServer()
