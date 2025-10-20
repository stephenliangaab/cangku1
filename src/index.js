/**
 * 数字员工夜间抓取系统 - 主程序入口
 * 基于 Jina AI 和 Claude Code 的自动化 AI 动态抓取和报告生成系统
 */

const logger = require('./utils/logger');
const configManager = require('./utils/config');
const Scheduler = require('./modules/scheduler');

class DigitalWorker {
  constructor() {
    this.scheduler = new Scheduler();
    this.isShuttingDown = false;
  }

  /**
   * 初始化应用程序
   */
  async init() {
    try {
      logger.info('🚀 启动数字员工夜间抓取系统');
      
      // 加载配置
      await configManager.init();
      logger.info('配置加载完成');
      
      // 初始化调度器
      await this.scheduler.init();
      logger.info('调度器初始化完成');
      
      // 设置进程信号处理
      this.setupProcessHandlers();
      
      logger.info('✅ 数字员工系统启动完成');
      logger.info(`📅 定时任务: ${this.scheduler.cronSchedule} (北京时间)`);
      logger.info('💡 使用 Ctrl+C 停止系统');
      
      // 执行健康检查
      const health = await this.scheduler.healthCheck();
      if (!health.healthy) {
        logger.warn('⚠️  系统健康检查发现异常，请检查配置');
      }
      
    } catch (error) {
      logger.error('❌ 系统启动失败', error);
      process.exit(1);
    }
  }

  /**
   * 设置进程信号处理
   */
  setupProcessHandlers() {
    // 优雅关闭处理
    const gracefulShutdown = async (signal) => {
      if (this.isShuttingDown) return;
      
      this.isShuttingDown = true;
      logger.info(`收到 ${signal} 信号，开始优雅关闭...`);
      
      try {
        // 停止调度器
        this.scheduler.stop();
        logger.info('调度器已停止');
        
        // 等待当前任务完成（如果有）
        if (this.scheduler.isRunning) {
          logger.info('等待当前任务完成...');
          // 这里可以添加超时机制
        }
        
        logger.info('✅ 系统已优雅关闭');
        process.exit(0);
        
      } catch (error) {
        logger.error('关闭系统时发生错误', error);
        process.exit(1);
      }
    };

    // 注册信号处理
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    
    // 未捕获异常处理
    process.on('uncaughtException', (error) => {
      logger.error('未捕获的异常', error);
      process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('未处理的 Promise 拒绝', { reason, promise });
      process.exit(1);
    });
  }

  /**
   * 运行应用程序
   */
  async run() {
    await this.init();
    
    // 保持进程运行
    setInterval(() => {
      // 心跳日志，证明系统在运行
      if (Math.random() < 0.01) { // 1% 概率记录心跳
        logger.debug('💓 系统运行中...');
      }
    }, 60000); // 每分钟检查一次
  }

  /**
   * 手动触发任务执行
   */
  async triggerManualExecution() {
    try {
      logger.info('手动触发任务执行');
      const result = await this.scheduler.triggerManualExecution();
      return result;
    } catch (error) {
      logger.error('手动触发任务失败', error);
      throw error;
    }
  }

  /**
   * 执行测试
   */
  async runTest() {
    try {
      logger.info('执行系统测试');
      const result = await this.scheduler.runTest();
      return result;
    } catch (error) {
      logger.error('系统测试失败', error);
      throw error;
    }
  }

  /**
   * 获取系统状态
   */
  async getStatus() {
    try {
      const status = this.scheduler.getStatus();
      const health = await this.scheduler.healthCheck();
      
      return {
        status,
        health,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('获取系统状态失败', error);
      throw error;
    }
  }
}

// 命令行接口
if (require.main === module) {
  const app = new DigitalWorker();
  
  // 解析命令行参数
  const args = process.argv.slice(2);
  const command = args[0];
  
  const runApp = async () => {
    if (command === 'test') {
      // 测试模式
      await app.init();
      const result = await app.runTest();
      console.log('测试结果:', result);
      process.exit(result.success ? 0 : 1);
      
    } else if (command === 'manual') {
      // 手动执行模式
      await app.init();
      const result = await app.triggerManualExecution();
      console.log('手动执行结果:', result);
      process.exit(result.success ? 0 : 1);
      
    } else if (command === 'status') {
      // 状态检查模式
      await app.init();
      const status = await app.getStatus();
      console.log('系统状态:', JSON.stringify(status, null, 2));
      process.exit(0);
      
    } else if (command === 'health') {
      // 健康检查模式
      await app.init();
      const health = await app.scheduler.healthCheck();
      console.log('健康状态:', JSON.stringify(health, null, 2));
      process.exit(health.healthy ? 0 : 1);
      
    } else {
      // 正常运行模式
      await app.run();
    }
  };
  
  runApp().catch(error => {
    logger.error('应用程序运行失败', error);
    process.exit(1);
  });
}

module.exports = DigitalWorker;
