/**
 * Deepseek AI 客户端模块
 * 提供智能摘要和内容分类功能
 * 使用 Deepseek API 替代 Claude API
 */

const axios = require('axios');
const logger = require('../utils/logger');
const configManager = require('../utils/config');
const Helpers = require('../utils/helpers');

class ClaudeClient {
  constructor() {
    // 使用 Deepseek API 配置
    this.apiKey = configManager.get('DEEPSEEK_API_KEY'); // 只允许通过环境变量获取密钥，安全合规
    this.model = configManager.get('DEEPSEEK_MODEL', 'deepseek-chat');
    this.baseURL = 'https://api.deepseek.com/v1';
    this.timeout = configManager.getSystemConfig().requestTimeout;
    
    // 创建 HTTP 客户端
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * 发送消息给 Deepseek
   * @param {string} message 消息内容
   * @param {Object} options 选项
   * @returns {Promise<string>} Deepseek 的回复
   */
  async sendMessage(message, options = {}) {
    const maxRetries = 3;
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const systemPrompt = options.systemPrompt || '你是一个专业的 AI 内容分析助手，擅长从多篇文章中提取关键信息、生成摘要和分类。请用中文回答，保持专业和准确。';
        
        // Deepseek API 使用 OpenAI 兼容格式
        const requestData = {
          model: this.model,
          max_tokens: options.maxTokens || 4000,
          temperature: options.temperature || 0.3,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: message
            }
          ]
        };

        logger.info(`发送消息给 Deepseek... (尝试 ${attempt}/${maxRetries})`);
        
        // 增加超时时间，避免网络问题
        const response = await this.client.post('/chat/completions', requestData, {
          timeout: 60000 // 60秒超时
        });
        
        // Deepseek 响应格式与 OpenAI 相同
        const content = response.data.choices[0].message.content;
        logger.info('Deepseek 回复接收完成');
        
        return content;
        
      } catch (error) {
        lastError = error;
        logger.warn(`Deepseek API 调用失败 (尝试 ${attempt}/${maxRetries})`, error.message);
        
        // 如果不是最后一次尝试，等待后重试
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // 指数退避
          logger.info(`等待 ${delay}ms 后重试...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
    }
    
    // 所有重试都失败
    logger.error('Deepseek API 调用失败，所有重试都已用尽', lastError.response?.data || lastError.message);
    throw new Error(`Deepseek API 调用失败: ${lastError.message}`);
  }

  /**
   * 生成内容摘要
   * @param {Array} articles 文章数组
   * @returns {Promise<string>} 摘要内容
   */
  async generateSummary(articles) {
    try {
      logger.info(`开始生成 ${articles.length} 篇文章的摘要`);
      
      // 构建提示词
      const promptTemplate = configManager.getPromptTemplate('summary') || 
        '请基于以下 {count} 篇文章，生成 3-5 点要点型摘要，突出最重要的 AI 动态和发展趋势：\n\n{articles}\n\n请用中文回答，格式清晰，要点明确。';
      
      const articlesText = articles.map((article, index) => 
        `文章 ${index + 1}:\n标题: ${article.title}\n内容: ${Helpers.truncate(article.content || article.markdown || '', 1000)}\n`
      ).join('\n');
      
      const prompt = promptTemplate
        .replace('{count}', articles.length)
        .replace('{articles}', articlesText);
      
      const summary = await this.sendMessage(prompt, {
        maxTokens: 2000,
        temperature: 0.2
      });
      
      logger.info('摘要生成完成');
      return summary;
      
    } catch (error) {
      logger.error('生成摘要失败', error);
      throw error;
    }
  }


  /**
   * 提取关键要点
   * @param {string} content 文章内容
   * @returns {Promise<Array>} 关键要点数组
   */
  async extractKeyPoints(content) {
    try {
      logger.info('开始提取关键要点');
      
      const promptTemplate = configManager.getPromptTemplate('extract_key_points') || 
        '请从以下文章中提取 3-5 个关键要点，每个要点用一句话概括：\n\n{content}';
      
      const prompt = promptTemplate.replace('{content}', Helpers.truncate(content, 3000));
      
      const response = await this.sendMessage(prompt, {
        maxTokens: 1000,
        temperature: 0.2
      });
      
      // 解析要点列表
      const points = response.split('\n')
        .filter(line => line.trim() && (line.includes('•') || line.includes('-') || line.match(/^\d+\./)))
        .map(line => line.replace(/^[•\-\d\.\s]+/, '').trim())
        .filter(point => point.length > 0);
      
      logger.info(`提取了 ${points.length} 个关键要点`);
      return points.length > 0 ? points : ['该文章暂无明确的关键要点'];
      
    } catch (error) {
      logger.error('提取关键要点失败', error);
      return ['关键要点提取失败'];
    }
  }

  /**
   * 批量处理文章
   * @param {Array} articles 文章数组
   * @returns {Promise<Object>} 处理结果
   */
  async processArticles(articles) {
    try {
      logger.info(`开始批量处理 ${articles.length} 篇文章`);
      
      // 过滤掉有错误的文章
      const validArticles = articles.filter(article => !article.error);
      
      if (validArticles.length === 0) {
        logger.warn('没有有效的文章可处理');
        return {
          summary: '暂无有效内容',
          articles: [],
          totalArticles: 0
        };
      }
      
      // 生成摘要
      const summary = await this.generateSummary(validArticles);
      
      // 为每篇文章提取关键要点
      const articlesWithKeyPoints = await Promise.all(
        validArticles.map(async (article) => {
          const keyPoints = await this.extractKeyPoints(article.content || article.markdown || '');
          return {
            ...article,
            keyPoints
          };
        })
      );
      
      const result = {
        summary,
        articles: articlesWithKeyPoints,
        totalArticles: validArticles.length
      };
      
      logger.info('文章批量处理完成');
      return result;
      
    } catch (error) {
      logger.error('批量处理文章失败', error);
      throw error;
    }
  }

  /**
   * 健康检查
   * @returns {Promise<boolean>} 是否健康
   */
  async healthCheck() {
    try {
      // 发送一个简单的测试消息
      await this.sendMessage('你好，请回复"OK"', { maxTokens: 10 });
      logger.info('Deepseek API 健康检查通过');
      return true;
    } catch (error) {
      logger.error('Deepseek API 健康检查失败', error.message);
      return false;
    }
  }
}

module.exports = ClaudeClient;
