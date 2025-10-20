/**
 * 日志工具模块
 * 使用 winston 创建统一的日志记录器
 */

const winston = require('winston');
const path = require('path');

// 创建日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level.toUpperCase()}] ${message}${stack ? '\n' + stack : ''}`;
  })
);

// 创建日志记录器
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'digital-worker' },
  transports: [
    // 控制台输出
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    }),
    // 文件输出
    new winston.transports.File({
      filename: process.env.LOG_FILE || 'logs/digital-worker.log',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ]
});

// 添加错误处理
logger.on('error', (error) => {
  console.error('Logger error:', error);
});

module.exports = logger;
