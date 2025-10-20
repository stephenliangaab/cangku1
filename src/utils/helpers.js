/**
 * 辅助函数工具
 * 提供通用的工具函数
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

class Helpers {
  /**
   * 延迟执行函数
   * @param {number} ms 延迟时间(毫秒)
   * @returns {Promise}
   */
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 限制并发执行的 Promise 数量
   * @param {Array} items 要处理的项目数组
   * @param {Function} processor 处理函数
   * @param {number} concurrency 并发数量
   * @returns {Promise<Array>}
   */
  static async processConcurrently(items, processor, concurrency = 3) {
    const results = [];
    const queue = [...items];
    
    // 创建并发工作器
    const workers = Array(concurrency).fill().map(async () => {
      while (queue.length > 0) {
        const item = queue.shift();
        if (item) {
          try {
            const result = await processor(item);
            results.push(result);
          } catch (error) {
            logger.error(`处理项目失败: ${error.message}`);
            results.push({ error: error.message, item });
          }
        }
      }
    });
    
    // 等待所有工作器完成
    await Promise.all(workers);
    return results;
  }

  /**
   * 格式化日期
   * @param {Date} date 日期对象
   * @returns {string} 格式化后的日期字符串
   */
  static formatDate(date = new Date()) {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  /**
   * 格式化时间戳
   * @param {Date} date 日期对象
   * @returns {string} 格式化后的时间戳字符串
   */
  static formatTimestamp(date = new Date()) {
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * 生成唯一ID
   * @returns {string} 唯一ID
   */
  static generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * 保存文件
   * @param {string} filePath 文件路径
   * @param {string} content 文件内容
   * @returns {Promise}
   */
  static async saveFile(filePath, content) {
    try {
      // 确保目录存在
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      
      // 写入文件
      await fs.writeFile(filePath, content, 'utf8');
      logger.info(`文件已保存: ${filePath}`);
      return true;
    } catch (error) {
      logger.error(`保存文件失败: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * 读取文件
   * @param {string} filePath 文件路径
   * @returns {Promise<string>}
   */
  static async readFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return content;
    } catch (error) {
      logger.error(`读取文件失败: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * 检查文件是否存在
   * @param {string} filePath 文件路径
   * @returns {Promise<boolean>}
   */
  static async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 去除重复项目
   * @param {Array} items 项目数组
   * @param {string} key 去重键名
   * @returns {Array}
   */
  static removeDuplicates(items, key = 'url') {
    const seen = new Set();
    return items.filter(item => {
      const value = item[key];
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  }

  /**
   * 截断字符串
   * @param {string} str 要截断的字符串
   * @param {number} maxLength 最大长度
   * @returns {string}
   */
  static truncate(str, maxLength = 200) {
    if (str.length <= maxLength) return str;
    return str.substr(0, maxLength) + '...';
  }

  /**
   * 安全解析 JSON
   * @param {string} jsonString JSON 字符串
   * @param {any} defaultValue 默认值
   * @returns {any}
   */
  static safeParseJSON(jsonString, defaultValue = null) {
    try {
      return JSON.parse(jsonString);
    } catch {
      return defaultValue;
    }
  }

  /**
   * 验证 URL
   * @param {string} url URL 字符串
   * @returns {boolean}
   */
  static isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取域名
   * @param {string} url URL 字符串
   * @returns {string}
   */
  static getDomain(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }
}

module.exports = Helpers;
