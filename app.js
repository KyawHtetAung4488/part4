const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const blogRouter = require('./controllers/blog')
const userRouter = require('./controllers/user')
const loginRouter = require('./controllers/login')
const config = require('./utils.js/config')
const middleware = require('./utils.js/middleware')


const mongoUrl = config.MONGODB_URI
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true })
    .then(()=>{
        console.log('Connected to MongoDB', mongoUrl);
    })

app.use(cors())
app.use(express.json())
app.use(middleware.requestLogger)
app.use(express.json())
app.use(middleware.tokenExtractor)

app.use('/api/blogs', blogRouter)
app.use('/api/users', userRouter)
app.use('/api/login', loginRouter)
app.use(middleware.unknowEndpoint)
app.use(middleware.errorHandler)

module.exports = app