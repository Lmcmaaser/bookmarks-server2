const winston = require('winston');
const { NODE_ENV } = require('./config');

const logger = winston.createLogger({
    // log everything with a severity of info and greater
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'info.log' })
  ]
});
if (NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
};

module.exports = logger;
