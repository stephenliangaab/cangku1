/**
 * 配置管理工具
 * 统一管理环境变量和配置文件
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

class ConfigManager {
  constructor() {
    this.config = {};
    this.keywords = [];
    this.templates = {};
  }

  /**
   * 初始化配置管理器
   */
  async init() {
    try {
      // 加载环境变量 - 使用绝对路径确保正确加载
      const dotenv = require('dotenv');
      const envPath = path.join(__dirname, '../../.env');
      const result = dotenv.config({ path: envPath });
      
      if (result.error) {
        logger.warn('.env 文件加载失败，使用系统环境变量:', result.error);
      } else {
        logger.info('环境变量配置加载完成');
      }
      
      // 加载关键词配置
      await this.loadKeywords();
      
      // 加载模板配置
      await this.loadTemplates();
      
      // 验证必需配置
      this.validateRequiredConfig();
      
      logger.info('配置管理器初始化完成');
    } catch (error) {
      logger.error('配置管理器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 加载关键词配置
   */
  async loadKeywords() {
    try {
      const keywordsPath = path.join(__dirname, '../../config/keywords.json');
      const data = await fs.readFile(keywordsPath, 'utf8');
      const config = JSON.parse(data);
      
      this.keywords = config.keywords || [];
      this.categories = config.categories || {};
      
      logger.info(`已加载 ${this.keywords.length} 个搜索关键词`);
    } catch (error) {
      logger.warn('加载关键词配置失败，使用默认关键词');
      this.keywords = ['AI 前沿', '大型模型动态', '技术趋势'];
      this.categories = {};
    }
  }

  /**
   * 加载模板配置
   */
  async loadTemplates() {
    try {
      const templatesPath = path.join(__dirname, '../../config/templates.json');
      const data = await fs.readFile(templatesPath, 'utf8');
      this.templates = JSON.parse(data);
      
      logger.info('模板配置加载完成');
    } catch (error) {
      logger.warn('加载模板配置失败，使用默认模板');
      this.templates = {
        report: {
          title: 'AI 动态夜报 - {date}',
          sections: {}
        },
        prompts: {}
      };
    }
  }

  /**
   * 验证必需配置
   */
  validateRequiredConfig() {
    // 只校验项目真正用到的环境变量
    const required = ['JINA_API_KEY', 'DEEPSEEK_API_KEY'];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(`缺少必需的环境变量: ${missing.join(', ')}`);
    }
  }

  /**
   * 获取配置值
   */
  get(key, defaultValue = null) {
    return process.env[key] || defaultValue;
  }

  /**
   * 获取搜索关键词
   */
  getKeywords() {
    return this.keywords;
  }

  /**
   * 获取分类配置
   */
  getCategories() {
    return this.categories;
  }

  /**
   * 获取报告模板
   */
  getReportTemplate() {
    return this.templates.report || {};
  }

  /**
   * 获取提示词模板
   */
  getPromptTemplate(name) {
    return this.templates.prompts?.[name] || '';
  }

  /**
   * 获取系统配置
   */
  getSystemConfig() {
    return {
      maxResults: parseInt(this.get('MAX_RESULTS', '10')),
      maxConcurrent: parseInt(this.get('MAX_CONCURRENT', '3')),
      requestTimeout: parseInt(this.get('REQUEST_TIMEOUT', '30000')),
      cronSchedule: this.get('CRON_SCHEDULE', '0 7 * * *')
    };
  }
}

// 创建单例实例
const configManager = new ConfigManager();

module.exports = configManager;
