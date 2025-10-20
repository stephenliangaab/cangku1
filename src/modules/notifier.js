/**
 * 通知推送模块
 * 负责将报告推送到飞书、Slack 等渠道
 */

const { WebClient } = require('@slack/web-api');
const logger = require('../utils/logger');
const configManager = require('../utils/config');
const Helpers = require('../utils/helpers');

class Notifier {
  constructor() {
    this.feishuConfig = this.getFeishuConfig();
    this.slackConfig = this.getSlackConfig();
    this.slackClient = null;
    
    this.initFeishu();
    this.initSlack();
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
   * 获取 Slack 配置
   */
  getSlackConfig() {
    return {
      webhookUrl: configManager.get('SLACK_WEBHOOK_URL'),
      channel: configManager.get('SLACK_CHANNEL', '#ai-news'),
      token: configManager.get('SLACK_BOT_TOKEN')
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
   * 初始化 Slack 客户端
   */
  initSlack() {
    if (this.slackConfig.token) {
      try {
        this.slackClient = new WebClient(this.slackConfig.token);
        logger.info('Slack 客户端初始化完成');
      } catch (error) {
        logger.error('Slack 客户端初始化失败', error);
      }
    } else if (this.slackConfig.webhookUrl) {
      logger.info('Slack Webhook 配置完成');
    } else {
      logger.warn('Slack 配置不完整，Slack 通知功能将不可用');
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
    // 直接返回完整的报告内容
    let content = `${report.title}\n\n`;
    content += `📅 生成时间: ${report.timestamp}\n`;
    content += `📊 文章数量: ${report.totalArticles} 篇\n\n`;
    content += `---\n\n`;
    content += `${report.content}\n\n`;
    content += `---\n\n`;
    
    if (report.categories) {
      const categoryStats = Object.entries(report.categories)
        .map(([category, count]) => `• ${category}: ${count} 篇`)
        .join('\n');
      content += `📈 分类统计:\n${categoryStats}\n\n`;
    }
    
    content += `💡 完整报告已保存到本地文件`;
    
    return content;
  }

  /**
   * 发送 Slack 通知
   * @param {Object} report 报告对象
   * @returns {Promise<boolean>} 是否发送成功
   */
  async sendSlack(report) {
    // 优先使用 Webhook
    if (this.slackConfig.webhookUrl) {
      return await this.sendSlackWebhook(report);
    }
    
    // 其次使用 Bot Token
    if (this.slackClient) {
      return await this.sendSlackMessage(report);
    }
    
    logger.warn('Slack 配置不完整，跳过 Slack 发送');
    return false;
  }

  /**
   * 使用 Webhook 发送 Slack 消息
   * @param {Object} report 报告对象
   * @returns {Promise<boolean>} 是否发送成功
   */
  async sendSlackWebhook(report) {
    try {
      const axios = require('axios');
      
      const message = {
        channel: this.slackConfig.channel,
        username: 'AI 动态夜报机器人',
        icon_emoji: ':robot_face:',
        blocks: this.formatSlackBlocks(report)
      };

      await axios.post(this.slackConfig.webhookUrl, message);
      logger.info('Slack Webhook 消息发送成功');
      return true;
      
    } catch (error) {
      logger.error('Slack Webhook 消息发送失败', error);
      return false;
    }
  }

  /**
   * 使用 Bot Token 发送 Slack 消息
   * @param {Object} report 报告对象
   * @returns {Promise<boolean>} 是否发送成功
   */
  async sendSlackMessage(report) {
    try {
      const result = await this.slackClient.chat.postMessage({
        channel: this.slackConfig.channel,
        text: report.title,
        blocks: this.formatSlackBlocks(report),
        username: 'AI 动态夜报机器人',
        icon_emoji: ':robot_face:'
      });

      logger.info(`Slack 消息发送成功: ${result.ts}`);
      return true;
      
    } catch (error) {
      logger.error('Slack 消息发送失败', error);
      return false;
    }
  }

  /**
   * 格式化 Slack Blocks
   * @param {Object} report 报告对象
   * @returns {Array} Slack Blocks 数组
   */
  formatSlackBlocks(report) {
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: report.title
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*生成时间:*\n${report.timestamp}`
          },
          {
            type: 'mrkdwn',
            text: `*文章数量:*\n${report.totalArticles} 篇`
          }
        ]
      },
      {
        type: 'divider'
      }
    ];

    // 添加摘要（截断以避免过长）
    const summary = Helpers.truncate(report.content.split('\n\n')[1] || '暂无摘要', 500);
    if (summary) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*核心要点:*\n${summary}`
        }
      });
    }

    // 添加分类统计
    if (report.categories) {
      const categoryStats = Object.entries(report.categories)
        .map(([category, count]) => `• ${category}: ${count} 篇`)
        .join('\n');
      
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*分类统计:*\n${categoryStats}`
        }
      });
    }

    // 添加查看完整报告的按钮
    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '查看完整报告'
          },
          style: 'primary',
          value: 'view_full_report'
        }
      ]
    });

    return blocks;
  }

  /**
   * 发送所有通知
   * @param {Object} report 报告对象
   * @returns {Promise<Object>} 发送结果
   */
  async sendAllNotifications(report) {
    const results = {
      feishu: false,
      slack: false,
      timestamp: new Date().toISOString()
    };

    try {
      logger.info('开始发送通知');
      
      // 并行发送飞书和 Slack 通知
      const [feishuResult, slackResult] = await Promise.allSettled([
        this.sendFeishu(report),
        this.sendSlack(report)
      ]);

      results.feishu = feishuResult.status === 'fulfilled' ? feishuResult.value : false;
      results.slack = slackResult.status === 'fulfilled' ? slackResult.value : false;

      if (feishuResult.status === 'rejected') {
        logger.error('飞书发送失败', feishuResult.reason);
      }
      if (slackResult.status === 'rejected') {
        logger.error('Slack 发送失败', slackResult.reason);
      }

      const successCount = [results.feishu, results.slack].filter(Boolean).length;
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
      slack: false,
      timestamp: new Date().toISOString()
    };

    try {
      // 检查飞书配置
      if (this.feishuConfig.webhookUrl) {
        results.feishu = true; // Webhook 配置存在即认为健康
      }

      // 检查 Slack 配置
      if (this.slackClient) {
        await this.slackClient.auth.test();
        results.slack = true;
      } else if (this.slackConfig.webhookUrl) {
        results.slack = true; // Webhook 配置存在即认为健康
      }

      return results;
      
    } catch (error) {
      logger.error('通知系统健康检查失败', error);
      return results;
    }
  }
}

module.exports = Notifier;
