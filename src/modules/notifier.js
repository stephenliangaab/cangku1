/**
 * 通知推送模块
 * 负责将报告推送到飞书渠道
 */

const logger = require('../utils/logger');
const configManager = require('../utils/config');
const Helpers = require('../utils/helpers');

class Notifier {
  constructor() {
    this.feishuConfig = this.getFeishuConfig();
    
    this.initFeishu();
  }

  /**
   * 获取飞书配置
   */
  getFeishuConfig() {
    return {
      webhookUrl: configManager.get('FEISHU_WEBHOOK_URL', 'https://open.feishu.cn/open-apis/bot/v2/hook/cf30d1da-50a8-4396-adc3-e02cf893ce78')
    };
  }

  /**
   * 初始化飞书客户端
   */
  initFeishu() {
    if (this.feishuConfig.webhookUrl) {
      logger.info('飞书 Webhook 配置完成');
    } else {
      logger.warn('飞书配置不完整，飞书通知功能将不可用');
    }
  }

  /**
   * 发送飞书通知
   * @param {Object} report 报告对象
   * @returns {Promise<boolean>} 是否发送成功
   */
  async sendFeishu(report) {
    if (!this.feishuConfig.webhookUrl) {
      logger.warn('飞书配置不完整，跳过飞书发送');
      return false;
    }

    try {
      const axios = require('axios');
      
      const message = {
        msg_type: 'text',
        content: {
          text: this.formatFeishuContent(report)
        }
      };

      await axios.post(this.feishuConfig.webhookUrl, message);
      logger.info('飞书 Webhook 消息发送成功');
      return true;
      
    } catch (error) {
      logger.error('飞书 Webhook 消息发送失败', error);
      return false;
    }
  }

  /**
   * 格式化飞书消息内容
   * @param {Object} report 报告对象
   * @returns {string} 飞书消息内容
   */
  formatFeishuContent(report) {
    // 使用新的结构化格式
    const timestamp = report.timestamp || Helpers.formatTimestamp();
    const timeStr = this.extractTime(timestamp); // 提取时间部分 HH:mm
    const totalNews = report.totalArticles || 0;
    
    let content = `总新闻数: ${totalNews}\n`;
    content += `时间: ${timestamp}\n`;
    content += `类型: 热点词汇统计\n\n`;
    
    // 如果有文章列表，按分类组织
    if (report.articles && report.articles.length > 0) {
      // 按关键词分类（简化版：使用第一个关键词作为分类）
      const categories = this.groupArticlesByCategory(report.articles, report.keywords);
      
      // 显示分类统计
      const categoryEntries = Object.entries(categories);
      categoryEntries.forEach(([category, articles], index) => {
        const categoryNum = index + 1;
        const totalCategories = categoryEntries.length;
        content += `📊 [${categoryNum}/${totalCategories}] ${category}: ${articles.length}条\n`;
      });
      
      content += `\n`;
      
      // 显示新闻列表
      let articleIndex = 1;
      categoryEntries.forEach(([category, articles]) => {
        articles.forEach(article => {
          const source = this.extractSource(article.url);
          const title = article.title || '无标题';
          // 引用数使用 keyPoints 数量，如果没有则使用默认值
          const refCount = article.keyPoints && article.keyPoints.length > 0 
            ? article.keyPoints.length 
            : (article.links ? article.links.length : 0);
          // 优先使用文章发布时间，否则使用报告生成时间
          const articleTime = article.published 
            ? this.extractTime(article.published) 
            : timeStr;
          
          content += `${articleIndex}. [${source}] ${title}[${refCount}] - ${articleTime}\n`;
          articleIndex++;
        });
      });
    } else {
      // 如果没有文章列表，使用原来的格式
      content += `${report.content}\n`;
    }
    
    return content;
  }

  /**
   * 从时间戳中提取时间部分 (HH:mm)
   * @param {string} timestamp 时间戳字符串
   * @returns {string} 时间字符串
   */
  extractTime(timestamp) {
    if (!timestamp) return '00:00';
    
    try {
      // 尝试解析各种时间格式
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        // 格式化为 HH:mm
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
      }
      
      // 如果不是标准格式，尝试从字符串中提取
      const match = timestamp.match(/(\d{1,2}):(\d{2})/);
      if (match) {
        return match[0];
      }
      
      // 尝试从 "2026/01/15 17:38:24" 格式中提取
      const parts = timestamp.split(' ');
      if (parts.length >= 2) {
        const timePart = parts[1];
        if (timePart && timePart.includes(':')) {
          return timePart.substring(0, 5); // 取前5个字符 "HH:mm"
        }
      }
      
      return '00:00';
    } catch {
      return '00:00';
    }
  }

  /**
   * 从URL提取来源域名
   * @param {string} url URL字符串
   * @returns {string} 来源名称
   */
  extractSource(url) {
    if (!url) return '未知来源';
    
    try {
      const domain = Helpers.getDomain(url);
      // 移除 www. 前缀
      let source = domain.replace(/^www\./, '');
      
      // 常见来源映射表（中文名称）
      const sourceMap = {
        'tieba.baidu.com': '贴吧',
        'cls.cn': '财联社热门',
        'wallstreetcn.com': '华尔街见闻',
        'thepaper.cn': '澎湃新闻',
        '36kr.com': '36氪',
        'techcrunch.com': 'TechCrunch',
        'reuters.com': '路透社',
        'bloomberg.com': '彭博',
        'ft.com': '金融时报',
        'wsj.com': '华尔街日报'
      };
      
      // 检查是否有映射
      if (sourceMap[source]) {
        return sourceMap[source];
      }
      
      // 提取主域名（去掉子域名和顶级域名）
      const parts = source.split('.');
      if (parts.length >= 2) {
        // 返回主域名部分
        const mainDomain = parts[parts.length - 2];
        // 首字母大写
        return mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1);
      }
      return source;
    } catch {
      return '未知来源';
    }
  }

  /**
   * 按分类组织文章
   * @param {Array} articles 文章数组
   * @param {string} keywords 关键词字符串
   * @returns {Object} 按分类组织的文章对象
   */
  groupArticlesByCategory(articles, keywords) {
    // 如果没有关键词，使用默认分类
    if (!keywords || keywords.trim() === '') {
      return {
        'AI 动态': articles
      };
    }
    
    // 简化版：使用第一个关键词作为分类名
    const keywordList = keywords.split(',').map(k => k.trim()).filter(k => k);
    const categoryName = keywordList[0] || 'AI 动态';
    
    return {
      [categoryName]: articles
    };
  }

  /**
   * 发送所有通知
   * @param {Object} report 报告对象
   * @returns {Promise<Object>} 发送结果
   */
  async sendAllNotifications(report) {
    const results = {
      feishu: false,
      timestamp: new Date().toISOString()
    };

    try {
      logger.info('开始发送通知');
      
      // 发送飞书通知
      const feishuResult = await Promise.allSettled([
        this.sendFeishu(report)
      ]);

      results.feishu = feishuResult[0].status === 'fulfilled' ? feishuResult[0].value : false;

      if (feishuResult[0].status === 'rejected') {
        logger.error('飞书发送失败', feishuResult[0].reason);
      }

      const successCount = results.feishu ? 1 : 0;
      logger.info(`通知发送完成: ${successCount} 个渠道成功`);
      
      return results;
      
    } catch (error) {
      logger.error('通知发送失败', error);
      return results;
    }
  }

  /**
   * 发送错误通知
   * @param {string} errorMessage 错误信息
   * @param {Object} context 上下文信息
   * @returns {Promise<Object>} 发送结果
   */
  async sendErrorNotification(errorMessage, context = {}) {
    const errorReport = {
      title: '❌ 数字员工系统错误报告',
      content: `错误信息: ${errorMessage}\n\n上下文: ${JSON.stringify(context, null, 2)}`,
      timestamp: Helpers.formatTimestamp(),
      totalArticles: 0
    };

    return await this.sendAllNotifications(errorReport);
  }

  /**
   * 健康检查
   * @returns {Promise<Object>} 健康状态
   */
  async healthCheck() {
    const results = {
      feishu: false,
      timestamp: new Date().toISOString()
    };

    try {
      // 检查飞书配置
      if (this.feishuConfig.webhookUrl) {
        results.feishu = true; // Webhook 配置存在即认为健康
      }

      return results;
      
    } catch (error) {
      logger.error('通知系统健康检查失败', error);
      return results;
    }
  }
}

module.exports = Notifier;