const mongoose = require('mongoose')
const supertext = require('supertest')
const helper = require('./test_helper')
const Blog = require('../models/blog')
const User = require('../models/user')
const app = require('../app')
const api = supertext(app)
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
let token

beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('KyawHtetAung', 10)
    const user = new User({ username: 'root', passwordHash})

    await user.save()

    const userToken = {
        username: user.username,
        id: user.id,
    }
    token = jwt.sign(userToken, process.env.SECRET)
    await Blog.deleteMany({})
    const blogObj = helper.initialBlogs.map(blog => new Blog(blog))
    const promiseArr = blogObj.map(blog => blog.save())
    await Promise.all(promiseArr)
})

test('blog are returned as json', async () => {
    await api.get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

test('unique identifier property of the blog posts must be id', async () => {
    const response = await api.get('/api/blogs')
    const blog = response.body[0]
    expect(blog.id).toBeDefined()
})

test('a valid blog can be added ', async () => {
    const newBlog = {
        title: "Canonical string reduction", 
        author: "Edsger W. Dijkstra", 
        url: "http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html", 
        likes: 12,
    }
    
    await api
        .post('/api/blogs')
        .send(newBlog)
        .set('Authorization', `bearer ${token}`)
        .expect(200)
        .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

    const titles = blogsAtEnd.map(r => r.title)
    expect(titles).toContain(newBlog.title)
})

test('blogs without likes properties will default to the value 0', async () => {
    const newBlog = {
        title: "First class tests", 
        author: "Robert C. Martin", 
        url: "http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.htmll",
    }

    await api
        .post('/api/blogs')
        .send(newBlog)
        .set('Authorization', `bearer ${token}`)
        .expect(200)
    
    const blogsAtEnd = await helper.blogsInDb()

    expect(blogsAtEnd[blogsAtEnd.length - 1].likes).toBe(0)
})

test('blogs without title or url properties will not added', async () => {
    const newBlog = {
        author: "Robert C. Martin", 
        likes: 0, 
    }

    await api
        .post('/api/blogs')
        .send(newBlog)
        .set('Authorization', `bearer ${token}`)
        .expect(404)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
})

test('delete a blog with valid id', async () => {

    const newBlog = {
        title: "Canonical string reduction", 
        author: "Edsger W. Dijkstra", 
        url: "http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html", 
        likes: 12,
    }
    
    const blogToDelete = await api
        .post('/api/blogs')
        .send(newBlog)
        .set('Authorization', `bearer ${token}`)
        .expect(200)
        .expect('Content-Type', /application\/json/)
    
    // const blogToDelete = await api.get(`/api/blogs/${result.body.id}`)
    // console.log(blogToDelete)

    await api
        .delete(`/api/blogs/${blogToDelete.body.id}`)
        .set('Authorization', `bearer ${token}`)
        .expect(204)

    const blogsAtEnd = await helper.blogsInDb()

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
    const titles = blogsAtEnd.map(r => r.title)
    expect(titles).not.toContain(blogToDelete.title)
})

test('update a blog with valid id', async () => {
    const blogAtStart = await helper.blogsInDb()
    let blogToUpdate = blogAtStart[0]
    blogToUpdate.likes = 12

    await api
        .put(`/api/blogs/${blogToUpdate.id}`)
        .send(blogToUpdate)
        .expect(200)
    
    const blogsAtEnd = await helper.blogsInDb()

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
    expect(blogsAtEnd[0].likes).toBe(blogToUpdate.likes)
})

test('fail to add blog with invalid token', async () => {
    const newBlog = {
        title: "Canonical string reduction", 
        author: "Edsger W. Dijkstra", 
        url: "http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html", 
        likes: 12,
    }

    const result = await api
        .post('/api/blogs')
        .send(newBlog)
        .set('Authorization', `bearer invalid token`)

    expect(result.status).toBe(401)
})

// ==============================================================================
describe('Testing User Controller', () => {
    beforeEach(async () => {
        await User.deleteMany({})

        const passwordHash = await bcrypt.hash('KyawHtetAung', 10)
        const user = new User({ username: 'root', passwordHash})

        await user.save()
    })

    test('creation succeeds with a fresh username', async () => {
        const usersAtStart = await helper.usersInDb()
    
        const newUser = {
            username: 'John Doe',
            name: 'JohnDoe',
            password: 'John',
        }
    
        await api
            .post('/api/users')
            .send(newUser)
            .expect(200)
            .expect('Content-Type', /application\/json/)
    
        const userAtEnd = await helper.usersInDb()
        expect(userAtEnd).toHaveLength(usersAtStart.length + 1)
    
        const usernames = userAtEnd.map(user => user.username)
        expect(usernames).toContain(newUser.username)
    })

    test('fail to create user with username already taken', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'root',
            name: 'rootuser',
            password: 'rootuser',
        }

        const result =  await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(result.body.error).toContain('`username` to be unique')
        const userAtEnd = await helper.usersInDb()
        expect(userAtEnd).toHaveLength(usersAtStart.length)
    })
    
    
})

afterAll(() => {
    mongoose.connection.close()
})