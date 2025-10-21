/**
 * 调试健康检查问题
 */

const configManager = require('./src/utils/config');
const JinaClient = require('./src/modules/jina-client');
const ClaudeClient = require('./src/modules/deepseek-client');

async function debugHealthCheck() {
  console.log('开始调试健康检查问题...\n');
  
  try {
    // 初始化配置管理器
    await configManager.init();
    
    // 创建客户端实例
    const jinaClient = new JinaClient();
    const claudeClient = new ClaudeClient();
    
    console.log('1. 单独测试 Jina 客户端健康检查...');
    try {
      const jinaHealth = await jinaClient.healthCheck();
      console.log(`✅ Jina 健康检查结果: ${jinaHealth}`);
      console.log(`   Jina API 密钥: ${jinaClient.apiKey ? '已配置' : '未配置'}`);
      console.log(`   Jina 客户端: ${jinaClient.dsClient ? '已创建' : '未创建'}`);
    } catch (error) {
      console.log(`❌ Jina 健康检查失败: ${error.message}`);
    }
    
    console.log('\n2. 单独测试 Claude 客户端健康检查...');
    try {
      const claudeHealth = await claudeClient.healthCheck();
      console.log(`✅ Claude 健康检查结果: ${claudeHealth}`);
      console.log(`   Claude API 密钥: ${claudeClient.apiKey ? '已配置' : '未配置'}`);
    } catch (error) {
      console.log(`❌ Claude 健康检查失败: ${error.message}`);
    }
    
    console.log('\n3. 测试处理器健康检查...');
    const ContentProcessor = require('./src/modules/processor');
    const processor = new ContentProcessor();
    
    try {
      const processorHealth = await processor.healthCheck();
      console.log(`✅ 处理器健康检查结果:`);
      console.log(`   整体状态: ${processorHealth.healthy}`);
      console.log(`   Jina 状态: ${processorHealth.jina}`);
      console.log(`   Claude 状态: ${processorHealth.claude}`);
      console.log(`   时间戳: ${processorHealth.timestamp}`);
    } catch (error) {
      console.log(`❌ 处理器健康检查失败: ${error.message}`);
    }
    
    console.log('\n4. 测试通知系统健康检查...');
    const Notifier = require('./src/modules/notifier');
    const notifier = new Notifier();
    
    try {
      const notifierHealth = await notifier.healthCheck();
      console.log(`✅ 通知系统健康检查结果:`);
      console.log(`   飞书状态: ${notifierHealth.feishu}`);
      console.log(`   Slack状态: ${notifierHealth.slack}`);
      console.log(`   时间戳: ${notifierHealth.timestamp}`);
    } catch (error) {
      console.log(`❌ 通知系统健康检查失败: ${error.message}`);
    }
    
    console.log('\n5. 测试调度器健康检查...');
    const Scheduler = require('./src/modules/scheduler');
    const scheduler = new Scheduler();
    
    try {
      const schedulerHealth = await scheduler.healthCheck();
      console.log(`✅ 调度器健康检查结果:`);
      console.log(`   整体状态: ${schedulerHealth.healthy}`);
      console.log(`   调度器状态: ${JSON.stringify(schedulerHealth.scheduler)}`);
      console.log(`   处理器状态: ${schedulerHealth.processor.healthy}`);
      console.log(`   通知器状态: 飞书=${schedulerHealth.notifier.feishu}, Slack=${schedulerHealth.notifier.slack}`);
      console.log(`   时间戳: ${schedulerHealth.timestamp}`);
    } catch (error) {
      console.log(`❌ 调度器健康检查失败: ${error.message}`);
    }
    
    console.log('\n6. 分析健康检查逻辑...');
    console.log('调度器健康检查要求:');
    console.log('   - 处理器健康检查必须通过');
    console.log('   - 至少一个通知渠道可用 (飞书或Slack)');
    console.log('如果通知系统没有可用的渠道，整体健康检查会失败');
    
  } catch (error) {
    console.error('调试过程中发生错误:', error);
  }
}

debugHealthCheck().catch(console.error);
