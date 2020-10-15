const blogRouter = require('express').Router()
require('express-async-errors')
const Blog = require('../models/blog')
const User = require('../models/user')
const jwt = require('jsonwebtoken')

blogRouter.get('/', async (request, response) => {
        const blogs = await Blog.find({}).populate('user', { username: 1, name: 1})
        response.json(blogs)
})

blogRouter.post('/', async (request, response) => {

    const body = request.body
    const token = request.token
    const decodedToken = jwt.verify(request.token, process.env.SECRET)
    if(!token || !decodedToken.id){
        return response.status(401).json({ error: 'token misssing or invalid'})
    }

    const user = await User.findById(decodedToken.id)

    if( body.title && body.url ){
        const blog = new Blog({
            title: body.title, 
            author: body.author, 
            url: body.url, 
            likes: body.likes || 0,
            user: user._id
        })
        const savedBlog = await blog.save()
        user.blogs = user.blogs.concat(savedBlog._id)
        await user.save()
        response.json(savedBlog)
    }
    else{
        response.status(404).end()
    }
})

blogRouter.delete('/:id', async (request, response) => {

    const decodedToken = jwt.verify(request.token, process.env.SECRET)

    if(!request.token || !decodedToken.id){
        return response.status(401).json({ error: 'token misssing or invalid'})
    }

    const blog = await Blog.findById(request.params.id)

    if(blog.user.toString() === decodedToken.id.toString()){
        await Blog.findByIdAndRemove(request.params.id)
        response.status(204).end()
    }
    else{
        response.status(404).end()
    }
})

blogRouter.put('/:id', async (request, response) => {
    const body = request.body
    const upBlog = {
        title: body.title,
        author: body.author, 
        url: body.url, 
        likes: body.likes || 0,
    }

    const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, upBlog, {new: true})
    response.json(updatedBlog)
})

module.exports = blogRouter