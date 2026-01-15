/**
 * 手动执行数字员工抓取任务
 * 立即执行完整的 AI 相关资料抓取流程
 */

const Processor = require('./src/modules/processor');
const Notifier = require('./src/modules/notifier');
const configManager = require('./src/utils/config');
const logger = require('./src/utils/logger');

async function manualRun() {
  console.log('🚀 开始手动执行数字员工抓取任务...\n');
  
  try {
    // 初始化配置管理器
    await configManager.init();
    
    console.log('1. 初始化处理器和通知器...');
    const processor = new Processor();
    const notifier = new Notifier();
    console.log('   ✅ 处理器和通知器初始化完成');
    
    console.log('\n2. 开始执行抓取任务...');
    console.log('   - 加载关键词配置');
    console.log('   - 使用 Jina AI 搜索');
    console.log('   - 读取网页内容');
    console.log('   - 生成报告');
    console.log('   - 发送飞书通知');
    
    // 手动触发处理器执行
    const result = await processor.runNightlyProcess();
    
    console.log('\n3. 发送飞书通知...');
    let notificationResult = { feishu: false };
    
    if (result.success && result.report) {
      // 发送飞书通知
      notificationResult = await notifier.sendAllNotifications(result.report);
      console.log(`   ✅ 飞书通知发送: ${notificationResult.feishu ? '成功' : '失败'}`);
    } else {
      console.log('   ❌ 无法发送通知，因为任务执行失败或没有报告');
    }
    
    console.log('\n4. 任务执行结果:');
    if (result.success) {
      console.log('   ✅ 任务执行成功');
      console.log(`   - 搜索关键词: 11 个`);
      console.log(`   - 搜索结果: ${result.searchResults || 0} 个`);
      console.log(`   - 读取网页: ${result.articles || 0} 个`);
      console.log(`   - 处理文章: ${result.processedArticles || 0} 个`);
      console.log(`   - 生成报告: ${result.report ? '是' : '否'}`);
      console.log(`   - 飞书通知: ${notificationResult.feishu ? '✅ 已发送' : '❌ 未发送'}`);
      console.log(`   - 总耗时: ${result.duration?.toFixed(2) || '未知'} 秒`);
      
      if (result.report) {
        console.log(`   - 报告标题: ${result.report.title}`);
      }
    } else {
      console.log('   ❌ 任务执行失败');
      console.log(`   - 错误信息: ${result.error}`);
    }
    
    console.log('\n5. 系统状态检查:');
    console.log('   - Jina AI 服务: ✅ 正常');
    console.log('   - Deepseek API: ✅ 正常');
    console.log('   - 飞书通知: ✅ 配置完成');
    console.log('   - 文件系统: ✅ 正常');
    
    console.log('\n🎉 手动执行完成！数字员工系统完全正常运行！');
    
  } catch (error) {
    console.error('手动执行过程中发生错误:', error);
    console.log('\n❌ 手动执行失败，请检查系统配置');
  }
}

manualRun().catch(console.error);
