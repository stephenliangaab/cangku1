/**
 * 内容处理和聚合模块
 * 负责协调 Jina AI 和 Claude Code 的工作流程
 */

const logger = require('../utils/logger');
const configManager = require('../utils/config');
const Helpers = require('../utils/helpers');
const JinaClient = require('./jina-client');
const ClaudeClient = require('./deepseek-client');

class ContentProcessor {
  constructor() {
    this.jinaClient = new JinaClient();
    this.claudeClient = new ClaudeClient();
    this.systemConfig = configManager.getSystemConfig();
  }

  /**
   * 执行完整的夜间抓取流程
   * @returns {Promise<Object>} 处理结果
   */
  async runNightlyProcess() {
    const startTime = Date.now();
    logger.info('开始夜间抓取流程');
    
    try {
      // 1. 搜索相关内容
      const searchResults = await this.searchContent();
      
      // 2. 抓取网页内容
      const articles = await this.fetchContent(searchResults);
      
      // 3. 智能处理内容
      const processedResult = await this.processContent(articles);
      
      // 4. 生成报告
      const report = await this.generateReport(processedResult);
      
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      
      logger.info(`夜间抓取流程完成，耗时 ${duration.toFixed(2)} 秒`);
      
      return {
        success: true,
        duration: duration,
        searchResults: searchResults.length,
        articles: articles.length,
        processedArticles: processedResult.totalArticles,
        report: report,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      logger.error('夜间抓取流程失败', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 搜索相关内容
   * @returns {Promise<Array>} 搜索结果
   */
  async searchContent() {
    try {
      const keywords = configManager.getKeywords();
      const maxResults = this.systemConfig.maxResults;
      
      logger.info(`使用 ${keywords.length} 个关键词搜索内容`);
      
      // 批量搜索所有关键词
      const searchResults = await this.jinaClient.batchSearch(keywords, Math.ceil(maxResults / keywords.length));
      
      // 按发布时间排序（如果有的话）
      const sortedResults = searchResults.sort((a, b) => {
        const dateA = a.published ? new Date(a.published) : new Date(0);
        const dateB = b.published ? new Date(b.published) : new Date(0);
        return dateB - dateA;
      });
      
      // 限制结果数量
      const limitedResults = sortedResults.slice(0, maxResults);
      
      logger.info(`搜索完成，获得 ${limitedResults.length} 个结果`);
      return limitedResults;
      
    } catch (error) {
      logger.error('内容搜索失败', error);
      throw error;
    }
  }

  /**
   * 抓取网页内容
   * @param {Array} searchResults 搜索结果
   * @returns {Promise<Array>} 文章内容数组
   */
  async fetchContent(searchResults) {
    try {
      if (searchResults.length === 0) {
        logger.warn('没有搜索结果可抓取');
        return [];
      }
      
      const urls = searchResults.map(result => result.url).filter(url => Helpers.isValidUrl(url));
      
      logger.info(`开始抓取 ${urls.length} 个网页的内容`);
      
      // 批量抓取网页内容
      const articles = await this.jinaClient.batchReadWebpages(
        urls, 
        this.systemConfig.maxConcurrent
      );
      
      // 合并搜索结果和抓取内容
      const mergedArticles = articles.map(article => {
        const searchResult = searchResults.find(result => result.url === article.url);
        return {
          ...searchResult,
          ...article
        };
      });
      
      // 过滤掉抓取失败的文章
      const validArticles = mergedArticles.filter(article => !article.error);
      
      logger.info(`内容抓取完成: ${validArticles.length} 成功, ${mergedArticles.length - validArticles.length} 失败`);
      return validArticles;
      
    } catch (error) {
      logger.error('内容抓取失败', error);
      throw error;
    }
  }

  /**
   * 处理内容
   * @param {Array} articles 文章数组
   * @returns {Promise<Object>} 处理结果
   */
  async processContent(articles) {
    try {
      if (articles.length === 0) {
        logger.warn('没有文章可处理');
        return {
          summary: '暂无有效内容',
          articles: [],
          totalArticles: 0
        };
      }
      
      logger.info(`开始处理 ${articles.length} 篇文章`);
      
      // 使用 Claude 处理文章（去掉分类功能）
      const processedResult = await this.claudeClient.processArticles(articles);
      
      logger.info('内容处理完成');
      return processedResult;
      
    } catch (error) {
      logger.error('内容处理失败', error);
      throw error;
    }
  }

  /**
   * 生成报告
   * @param {Object} processedResult 处理结果
   * @returns {Promise<Object>} 报告对象
   */
  async generateReport(processedResult) {
    try {
      logger.info('开始生成报告');
      
      const template = configManager.getReportTemplate();
      const timestamp = Helpers.formatTimestamp();
      const date = Helpers.formatDate();
      const keywords = configManager.getKeywords().join(', ');
      
      // 构建报告标题
      const title = template.title
        .replace('{date}', date);
      
      // 构建报告内容
      let reportContent = '';
      
      // 1. 前言部分
      if (template.sections.introduction) {
        const introduction = template.sections.introduction
          .replace('{timestamp}', timestamp)
          .replace('{keywords}', keywords)
          .replace('{total_articles}', processedResult.totalArticles)
          .replace('{filtered_articles}', processedResult.articles.length);
        reportContent += introduction + '\n\n';
      }
      
      // 2. 核心要点部分
      if (template.sections.summary && processedResult.summary) {
        const summary = template.sections.summary
          .replace('{summary_content}', processedResult.summary);
        reportContent += summary + '\n\n';
      }
      
      
      // 4. 参考链接部分
      if (template.sections.references) {
        const links = processedResult.articles.map(article => 
          `- [${article.title}](${article.url})`
        ).join('\n');
        
        const references = template.sections.references.replace('{links}', links);
        reportContent += references + '\n';
      }
      
      const report = {
        title: title,
        content: reportContent,
        timestamp: timestamp,
        totalArticles: processedResult.totalArticles
      };
      
      // 保存报告到文件
      const reportFileName = `nightly-report-${Date.now()}.md`;
      const reportPath = `data/reports/${reportFileName}`;
      await Helpers.saveFile(reportPath, `# ${report.title}\n\n${report.content}`);
      
      logger.info('报告生成完成');
      return report;
      
    } catch (error) {
      logger.error('报告生成失败', error);
      throw error;
    }
  }

  /**
   * 健康检查
   * @returns {Promise<Object>} 健康状态
   */
  async healthCheck() {
    try {
      const [jinaHealth, claudeHealth] = await Promise.all([
        this.jinaClient.healthCheck(),
        this.claudeClient.healthCheck()
      ]);
      
      const isHealthy = jinaHealth && claudeHealth;
      
      return {
        healthy: isHealthy,
        jina: jinaHealth,
        claude: claudeHealth,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      logger.error('健康检查失败', error);
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 测试流程
   * @returns {Promise<Object>} 测试结果
   */
  async testProcess() {
    try {
      logger.info('开始测试流程');
      
      // 使用少量关键词进行测试
      const testKeywords = ['AI 发展', '机器学习'];
      const testResults = await this.jinaClient.batchSearch(testKeywords, 2);
      
      if (testResults.length === 0) {
        throw new Error('测试搜索未返回结果');
      }
      
      const testArticles = await this.jinaClient.batchReadWebpages(
        testResults.slice(0, 2).map(r => r.url),
        1
      );
      
      const testProcessed = await this.claudeClient.processArticles(testArticles);
      
      logger.info('测试流程完成');
      return {
        success: true,
        searchResults: testResults.length,
        articles: testArticles.length,
        processed: testProcessed.totalArticles
      };
      
    } catch (error) {
      logger.error('测试流程失败', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = ContentProcessor;
