/**
 * 数字员工系统测试文件
 * 用于验证系统各个模块的功能
 */

const DigitalWorker = require('./index');
const logger = require('./utils/logger');

/**
 * 运行完整的系统测试
 */
async function runFullTest() {
  console.log('🧪 开始数字员工系统完整测试\n');
  
  const app = new DigitalWorker();
  
  try {
    // 1. 初始化系统
    console.log('1. 初始化系统...');
    await app.init();
    console.log('✅ 系统初始化成功\n');
    
    // 2. 健康检查
    console.log('2. 执行健康检查...');
    const health = await app.scheduler.healthCheck();
    console.log('健康检查结果:', JSON.stringify(health, null, 2));
    
    if (!health.healthy) {
      console.log('⚠️  健康检查未通过，但继续测试\n');
    } else {
      console.log('✅ 健康检查通过\n');
    }
    
    // 3. 执行测试任务
    console.log('3. 执行测试任务...');
    const testResult = await app.runTest();
    console.log('测试任务结果:', JSON.stringify(testResult, null, 2));
    
    if (testResult.success) {
      console.log('✅ 测试任务执行成功\n');
    } else {
      console.log('❌ 测试任务执行失败\n');
    }
    
    // 4. 获取系统状态
    console.log('4. 获取系统状态...');
    const status = await app.getStatus();
    console.log('系统状态:', JSON.stringify(status, null, 2));
    console.log('✅ 状态获取成功\n');
    
    // 5. 总结
    console.log('📊 测试总结:');
    console.log(`- 系统初始化: ✅ 成功`);
    console.log(`- 健康检查: ${health.healthy ? '✅ 通过' : '⚠️  异常'}`);
    console.log(`- 测试任务: ${testResult.success ? '✅ 成功' : '❌ 失败'}`);
    console.log(`- 状态查询: ✅ 成功`);
    
    if (health.healthy && testResult.success) {
      console.log('\n🎉 所有测试通过！系统可以正常运行。');
      return true;
    } else {
      console.log('\n⚠️  部分测试未通过，请检查配置和网络连接。');
      return false;
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
    return false;
  }
}

/**
 * 运行快速测试（不依赖外部 API）
 */
async function runQuickTest() {
  console.log('⚡ 开始快速测试（配置验证）\n');
  
  try {
    // 1. 检查配置文件
    console.log('1. 检查配置文件...');
    const fs = require('fs');
    const path = require('path');
    
    const requiredFiles = [
      'package.json',
      '.env.example', 
      'config/keywords.json',
      'config/templates.json',
      'src/index.js'
    ];
    
    let allFilesExist = true;
    for (const file of requiredFiles) {
      const exists = fs.existsSync(path.join(__dirname, '..', file));
      console.log(`   ${exists ? '✅' : '❌'} ${file}`);
      if (!exists) allFilesExist = false;
    }
    
    if (allFilesExist) {
      console.log('✅ 所有必需文件都存在\n');
    } else {
      console.log('❌ 缺少必需文件\n');
      return false;
    }
    
    // 2. 检查模块导入
    console.log('2. 检查模块导入...');
    try {
      const modules = [
        './utils/logger',
        './utils/config', 
        './utils/helpers',
        './modules/jina-client',
        './modules/deepseek-client',
        './modules/processor',
        './modules/notifier',
        './modules/scheduler'
      ];
      
      for (const modulePath of modules) {
        require(modulePath);
        console.log(`   ✅ ${modulePath}`);
      }
      console.log('✅ 所有模块都可以正常导入\n');
    } catch (error) {
      console.log(`❌ 模块导入失败: ${error.message}\n`);
      return false;
    }
    
    // 3. 检查配置结构
    console.log('3. 检查配置结构...');
    try {
      const keywords = require('../config/keywords.json');
      const templates = require('../config/templates.json');
      
      if (keywords.keywords && Array.isArray(keywords.keywords)) {
        console.log(`   ✅ keywords.json 配置正确 (${keywords.keywords.length} 个关键词)`);
      } else {
        console.log('❌ keywords.json 配置格式错误');
        return false;
      }
      
      if (templates.report && templates.prompts) {
        console.log('   ✅ templates.json 配置正确');
      } else {
        console.log('❌ templates.json 配置格式错误');
        return false;
      }
      
      console.log('✅ 配置结构检查通过\n');
    } catch (error) {
      console.log(`❌ 配置结构检查失败: ${error.message}\n`);
      return false;
    }
    
    console.log('🎉 快速测试通过！系统结构完整。');
    console.log('💡 提示: 运行完整测试需要配置 API 密钥');
    return true;
    
  } catch (error) {
    console.error('❌ 快速测试失败:', error);
    return false;
  }
}

// 命令行接口
if (require.main === module) {
  const args = process.argv.slice(2);
  const testType = args[0] || 'quick';
  
  if (testType === 'full') {
    runFullTest().then(success => {
      process.exit(success ? 0 : 1);
    });
  } else if (testType === 'quick') {
    runQuickTest().then(success => {
      process.exit(success ? 0 : 1);
    });
  } else {
    console.log('用法:');
    console.log('  node src/test.js quick    - 快速测试（推荐）');
    console.log('  node src/test.js full     - 完整测试（需要 API 密钥）');
    process.exit(1);
  }
}

module.exports = {
  runFullTest,
  runQuickTest
};
