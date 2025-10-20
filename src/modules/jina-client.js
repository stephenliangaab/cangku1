/**
 * Jina AI 客户端模块 - 根据官方 API 文档实现
 * 提供网页搜索和内容抓取功能
 * Get your Jina AI API key for free: https://jina.ai/?sui=apikey
 */

const axios = require('axios');
const logger = require('../utils/logger');
const configManager = require('../utils/config');
const Helpers = require('../utils/helpers');

class JinaClient {
  constructor() {
    // 延迟初始化，在第一次使用时再创建客户端
    this.apiKey = null;
    this.timeout = null;
    this.searchClient = null;
    this.readerClient = null;
  }

  /**
   * 初始化客户端（延迟初始化）
   */
  async init() {
    if (this.searchClient && this.readerClient) {
      return; // 已经初始化
    }
    
    this.apiKey = configManager.get('JINA_API_KEY');
    this.timeout = configManager.getSystemConfig().requestTimeout;
    
    // 记录 API 密钥信息（脱敏）
    if (this.apiKey) {
      logger.debug(`使用 Jina API 密钥: ${this.apiKey.slice(0, 8)}...`);
    } else {
      logger.warn('JINA_API_KEY 未配置');
    }
    
    // 创建搜索客户端 - 使用 Search API
    this.searchClient = axios.create({
      baseURL: 'https://s.jina.ai', // Search API 的正确域名
      timeout: this.timeout,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    // 创建 Reader 客户端 - 使用 Reader API
    this.readerClient = axios.create({
      baseURL: 'https://r.jina.ai', // Reader API 的域名
      timeout: this.timeout,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }

  /**
   * 确保客户端已初始化
   */
  async ensureInitialized() {
    if (!this.searchClient || !this.readerClient) {
      await this.init();
    }
  }

  /**
   * 搜索网页内容 - 使用 Search API
   * @param {string} query 搜索关键词
   * @param {number} limit 结果数量限制
   * @returns {Promise<Array>} 搜索结果数组
   */
  async searchWeb(query, limit = 10) {
    try {
      // 确保客户端已初始化
      await this.ensureInitialized();
      
      logger.info(`开始搜索: "${query}"`);
      
      // 使用 Search API 的正确端点和参数
      const response = await this.searchClient.post('/', {
        q: query,
        num: limit,
        gl: 'US'
      }, {
        headers: {
          'X-No-Cache': 'true',
          'X-With-Links-Summary': 'true',
          'X-Engine': 'direct',
          //单独搜索一个网站无法达到预期
          'X-Site': ''
        }
      });

      const results = response.data?.data || [];
      logger.info(`搜索完成，找到 ${results.length} 个结果`);
      
      return results.map(result => ({
        title: result.title || '',
        url: result.url || '',
        description: result.description || '',
        content: result.content || '',
        snippet: result.content ? result.content.substring(0, 200) + '...' : '',
        published: result.published || '',
        source: result.source || ''
      }));
      
    } catch (error) {
      logger.error(`搜索失败: "${query}"`, error.response?.data || error.message);
      throw new Error(`搜索失败: ${error.message}`);
    }
  }

  /**
   * 读取网页内容 - 使用 Reader API
   * @param {string} url 网页URL
   * @param {Object} options 选项
   * @returns {Promise<Object>} 网页内容对象
   */
  async readWebpage(url, options = {}) {
    try {
      // 确保客户端已初始化
      await this.ensureInitialized();
      
      logger.info(`开始读取网页: ${Helpers.truncate(url)}`);
      
      // 使用 Reader API 的正确方式
      const response = await this.readerClient.post('/', {
        url: url
      }, {
        headers: {
          'X-No-Cache': 'true',
          'X-With-Links-Summary': 'true',
          'X-With-Images-Summary': 'true',
          'X-Proxy': 'auto',
          'X-Return-Format': 'markdown'
          
        }
      });

      const content = response.data?.data || {};
      
      logger.info(`网页读取完成: ${Helpers.truncate(url)}`);
      
      return {
        url: url,
        title: content.title || '',
        description: content.description || '',
        content: content.content || '',
        text: content.content || '',
        markdown: content.content || '',
        images: content.images || [],
        links: content.links || [],
        published: content.published || '',
        language: content.language || 'zh',
        wordCount: content.content ? content.content.length : 0
      };
      
    } catch (error) {
      logger.error(`读取网页失败: ${Helpers.truncate(url)}`, error.response?.data || error.message);
      throw new Error(`读取网页失败: ${error.message}`);
    }
  }

  /**
   * 批量搜索多个关键词
   * @param {Array} keywords 关键词数组
   * @param {number} limitPerKeyword 每个关键词的结果数量
   * @returns {Promise<Array>} 合并的搜索结果
   */
  async batchSearch(keywords, limitPerKeyword = 5) {
    try {
      logger.info(`开始批量搜索 ${keywords.length} 个关键词`);
      
      const searchPromises = keywords.map(keyword => 
        this.searchWeb(keyword, limitPerKeyword)
      );
      
      const results = await Promise.allSettled(searchPromises);
      
      // 合并成功的结果
      const allResults = [];
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allResults.push(...result.value);
          logger.info(`关键词 "${keywords[index]}" 搜索完成，找到 ${result.value.length} 个结果`);
        } else {
          logger.error(`关键词 "${keywords[index]}" 搜索失败: ${result.reason}`);
        }
      });
      
      // 去重
      const uniqueResults = Helpers.removeDuplicates(allResults, 'url');
      
      logger.info(`批量搜索完成，共找到 ${uniqueResults.length} 个唯一结果`);
      return uniqueResults;
      
    } catch (error) {
      logger.error('批量搜索失败', error);
      throw error;
    }
  }

  /**
   * 批量读取多个网页
   * @param {Array} urls URL数组
   * @param {number} concurrency 并发数量
   * @returns {Promise<Array>} 网页内容数组
   */
  async batchReadWebpages(urls, concurrency = 3) {
    try {
      logger.info(`开始批量读取 ${urls.length} 个网页`);
      
      const results = await Helpers.processConcurrently(
        urls,
        async (url) => {
          try {
            // 添加随机延迟避免请求过于频繁
            await Helpers.sleep(Math.random() * 1000 + 500);
            return await this.readWebpage(url);
          } catch (error) {
            return {
              url: url,
              error: error.message,
              content: '',
              title: ''
            };
          }
        },
        concurrency
      );
      
      // 统计成功和失败的数量
      const successCount = results.filter(r => !r.error).length;
      const failCount = results.filter(r => r.error).length;
      
      logger.info(`批量读取完成: ${successCount} 成功, ${failCount} 失败`);
      return results;
      
    } catch (error) {
      logger.error('批量读取网页失败', error);
      throw error;
    }
  }

  /**
   * 健康检查
   * @returns {Promise<boolean>} 是否健康
   */
  async healthCheck() {
    try {
      // 确保客户端已初始化
      await this.ensureInitialized();
      
      // 使用 Reader API 进行健康检查
      const response = await this.readerClient.post('/', {
        url: 'https://example.com'
      }, {
        headers: {
          'X-No-Cache': 'true'
        }
      });
      
      // 如果响应状态是 200，则认为 API 密钥有效
      if (response.status === 200) {
        logger.info('Jina AI 服务健康检查通过');
        return true;
      } else {
        logger.error('Jina AI 服务健康检查失败: 非200状态码');
        return false;
      }
    } catch (error) {
      // 如果是网络连接问题，记录为警告而不是错误
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || 
          error.message.includes('network socket disconnected') ||
          error.message.includes('SSL connection timeout')) {
        logger.warn('Jina AI 服务暂时不可用（网络连接问题）');
      } else {
        logger.error('Jina AI 服务健康检查失败', error.message);
      }
      return false;
    }
  }
}

module.exports = JinaClient;
