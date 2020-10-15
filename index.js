const http = require('http')
const app = require('./app')
const config = require('./utils.js/config')
const logger = require('./utils.js/logger')

const server = http.createServer(app)

server.listen(config.PORT, () => {
    logger.info('server is running on port :', config.PORT)
})