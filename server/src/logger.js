const winston = require('winston');
const { combine, timestamp, json, errors } = winston.format;

const consoleFormat = combine(
    winston.format.colorize(),
    winston.format.printf(( { level, message, timestamp }) => {
        return `${timestamp} ${level}: ${message}`;
    })
);

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
        timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
        errors({ stack: true }),
        json()
    ),
    transports: [
        new winston.transports.Console({
            format: combine(timestamp(), consoleFormat)
        }),
        new winston.transports.File({
            filename: 'logs/app.log',
            level: 'info',
        }),
        new winston.transports.File({
            filename: 'logs/errors.log',
            level: 'error',
        })
    ]
});

module.exports = logger;