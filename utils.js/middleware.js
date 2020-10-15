const logger = require('./logger')

const requestLogger = (request, response, next) => {
    logger.info('Method :', request.method)
    logger.info('Path: ', request.path)
    logger.info('Body', request.body)
    logger.info('----')
    next()
}

const tokenExtractor = (request, response, next) => {
    const authorization = request.get('authorization')
    console.log('Token ', authorization)
    if(authorization && authorization.toLowerCase().startsWith('bearer'))
    {
        request.token = authorization.substring(7)
    }
    next()
}

const unknowEndpoint = (request, response) => {
    response.status(404).send({ error: 'unknow endpoint'})
}

const errorHandler = (error, req, res, next) => {
    logger.error(error.message)

    if(error.name === 'CastError' && error.kind === 'ObjectId') {
        return res.status(400).send({ error: 'malformatted id' })
    } 
    else if(error.name === 'ValidationError') {
        return res.status(400).json({ error: error.message })
    }
    else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'invalid token'})
    }
    next(error)
}

module.exports = {
    requestLogger, unknowEndpoint, errorHandler, tokenExtractor
}