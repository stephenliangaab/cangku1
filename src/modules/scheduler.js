/**
 * 定时调度器模块
 * 负责管理定时任务和任务执行
 */

const cron = require('node-cron');
const logger = require('../utils/logger');
const configManager = require('../utils/config');
const ContentProcessor = require('./processor');
const Notifier = require('./notifier');

class Scheduler {
  constructor() {
    this.processor = new ContentProcessor();
    this.notifier = new Notifier();
    this.cronSchedule = configManager.getSystemConfig().cronSchedule;
    this.isRunning = false;
    this.currentTask = null;
  }

  /**
   * 初始化调度器
   */
  async init() {
    try {
      logger.info('初始化调度器');
      
      // 检查系统健康状态
      const health = await this.healthCheck();
      if (!health.healthy) {
        logger.warn('系统健康检查未通过，但将继续初始化');
      }
      
      // 设置定时任务
      this.setupCronJob();
      
      logger.info(`调度器初始化完成，定时任务设置为: ${this.cronSchedule}`);
      return true;
      
    } catch (error) {
      logger.error('调度器初始化失败', error);
      throw error;
    }
  }

  /**
   * 设置定时任务
   */
  setupCronJob() {
    try {
      // 验证 cron 表达式
      if (!cron.validate(this.cronSchedule)) {
        throw new Error(`无效的 cron 表达式: ${this.cronSchedule}`);
      }
      
      // 创建定时任务
      this.cronJob = cron.schedule(this.cronSchedule, async () => {
        await this.executeNightlyTask();
      }, {
        scheduled: true,
        timezone: 'Asia/Shanghai'
      });
      
      logger.info(`定时任务已设置: ${this.cronSchedule} (北京时间)`);
      
    } catch (error) {
      logger.error('设置定时任务失败', error);
      throw error;
    }
  }

  /**
   * 执行夜间任务
   */
  async executeNightlyTask() {
    if (this.isRunning) {
      logger.warn('前一个任务仍在运行，跳过本次执行');
      return;
    }
    
    this.isRunning = true;
    const startTime = Date.now();
    
    try {
      logger.info('开始执行夜间任务');
      
      // 执行完整的夜间流程
      const processResult = await this.processor.runNightlyProcess();
      
      if (processResult.success) {
        logger.info('夜间流程执行成功，开始发送通知');
        
        // 发送成功通知
        const notificationResult = await this.notifier.sendAllNotifications(processResult.report);
        
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;
        
        logger.info(`夜间任务完成，耗时 ${duration.toFixed(2)} 秒`);
        logger.info(`处理结果: ${processResult.processedArticles} 篇文章`);
        logger.info(`通知结果: 邮件 ${notificationResult.email ? '成功' : '失败'}, Slack ${notificationResult.slack ? '成功' : '失败'}`);
        
      } else {
        logger.error('夜间流程执行失败', processResult.error);
        
        // 发送错误通知
        await this.notifier.sendErrorNotification(
          processResult.error,
          { timestamp: processResult.timestamp }
        );
      }
      
    } catch (error) {
      logger.error('夜间任务执行失败', error);
      
      // 发送错误通知
      await this.notifier.sendErrorNotification(
        error.message,
        { timestamp: new Date().toISOString() }
      );
      
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * 手动触发任务执行
   * @returns {Promise<Object>} 执行结果
   */
  async triggerManualExecution() {
    if (this.isRunning) {
      return {
        success: false,
        error: '前一个任务仍在运行中',
        timestamp: new Date().toISOString()
      };
    }
    
    logger.info('手动触发任务执行');
    await this.executeNightlyTask();
    
    return {
      success: true,
      message: '手动任务执行完成',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 执行测试任务
   * @returns {Promise<Object>} 测试结果
   */
  async runTest() {
    try {
      logger.info('开始执行测试任务');
      
      const testResult = await this.processor.testProcess();
      
      if (testResult.success) {
        logger.info('测试任务执行成功');
        
        // 发送测试报告
        const testReport = {
          title: '🧪 数字员工系统测试报告',
          content: `测试结果: 成功\n搜索结果: ${testResult.searchResults} 个\n抓取文章: ${testResult.articles} 篇\n处理文章: ${testResult.processed} 篇`,
          timestamp: new Date().toLocaleString('zh-CN'),
          totalArticles: testResult.processed
        };
        
        await this.notifier.sendAllNotifications(testReport);
        
      } else {
        logger.error('测试任务执行失败', testResult.error);
        
        await this.notifier.sendErrorNotification(
          `测试失败: ${testResult.error}`,
          { type: 'test' }
        );
      }
      
      return testResult;
      
    } catch (error) {
      logger.error('测试任务执行失败', error);
      
      await this.notifier.sendErrorNotification(
        `测试异常: ${error.message}`,
        { type: 'test', timestamp: new Date().toISOString() }
      );
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 健康检查
   * @returns {Promise<Object>} 健康状态
   */
  async healthCheck() {
    try {
      const [processorHealth, notifierHealth] = await Promise.all([
        this.processor.healthCheck(),
        this.notifier.healthCheck()
      ]);
      
      // 修正健康检查逻辑：至少一个通知渠道可用即可
      const isHealthy = processorHealth.healthy && 
                       (notifierHealth.feishu || notifierHealth.slack);
      
      const healthStatus = {
        healthy: isHealthy,
        scheduler: {
          running: this.isRunning,
          cronSchedule: this.cronSchedule,
          timezone: 'Asia/Shanghai'
        },
        processor: processorHealth,
        notifier: notifierHealth,
        timestamp: new Date().toISOString()
      };
      
      logger.info(`健康检查完成: ${isHealthy ? '健康' : '异常'}`);
      return healthStatus;
      
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
   * 获取任务状态
   * @returns {Object} 任务状态
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      cronSchedule: this.cronSchedule,
      lastExecution: this.lastExecutionTime,
      nextExecution: this.getNextExecutionTime(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 获取下次执行时间
   * @returns {Date} 下次执行时间
   */
  getNextExecutionTime() {
    if (!this.cronJob) return null;
    
    try {
      // node-cron 不直接提供下次执行时间，这里简单计算
      const now = new Date();
      const cronParts = this.cronSchedule.split(' ');
      
      if (cronParts.length >= 5) {
        // 简单的下次执行时间计算（仅支持固定时间）
        const [minute, hour] = cronParts;
        if (minute !== '*' && hour !== '*') {
          const next = new Date();
          next.setHours(parseInt(hour), parseInt(minute), 0, 0);
          if (next <= now) {
            next.setDate(next.getDate() + 1);
          }
          return next;
        }
      }
      
      return null;
      
    } catch (error) {
      logger.error('计算下次执行时间失败', error);
      return null;
    }
  }

  /**
   * 停止调度器
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      logger.info('调度器已停止');
    }
    
    this.isRunning = false;
  }

  /**
   * 启动调度器
   */
  start() {
    if (this.cronJob) {
      this.cronJob.start();
      logger.info('调度器已启动');
    }
  }

  /**
   * 销毁调度器
   */
  destroy() {
    this.stop();
    this.cronJob = null;
    logger.info('调度器已销毁');
  }
}

module.exports = Scheduler;
