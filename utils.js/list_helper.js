var _ = require('lodash')

const dummy = (blogs) => {
    return 1
}

const totalLikes = (blogs) => {
    return blogs.length === 0 
        ? 0
        : blogs.reduce((total , blogs)=> total+blogs.likes, 0)
}


const favoriteBlog = (blogs) => {
    return blogs.length === 0
        ? 0
        : blogs.sort((a, b) => a.likes -b.likes )[blogs.length-1]
}

const mostBlogs = (blogs) => {
    if(blogs.length === 0){
        return 0
    }
    else{
        const byauthors = _(blogs)
            .groupBy('author')
            .map((entries, author) => ({ author, blogs: entries.length }))
            .value()
        const most = _.maxBy(byauthors, 'blogs')
        return most
    }
}

const mostLikes = (blogs) => {
    if(blogs.length === 0){
        return 0
    }
    else{
        const byauthors = _(blogs)
            .groupBy('author')
            .map((entries, author) => ({ author, likes: _.sumBy(entries, 'likes') }))
            .value()

        const most = _.maxBy(byauthors, 'likes')
        return most
    }
}
module.exports = {
    dummy,
    totalLikes,
    favoriteBlog,
    mostBlogs,
    mostLikes,
}