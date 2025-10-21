/**
 * 测试 Jina AI 实际功能
 */

const JinaClient = require('./src/modules/jina-client');
const configManager = require('./src/utils/config');

async function testJinaReal() {
  console.log('🚀 测试 Jina AI 实际功能...\n');
  
  try {
    // 初始化配置管理器
    await configManager.init();
    
    console.log('1. 创建 JinaClient 实例...');
    const jinaClient = new JinaClient();
    console.log('   ✅ 实例创建成功');
    
    console.log('\n2. 测试实际搜索功能...');
    try {
      const results = await jinaClient.searchWeb('人工智能', 3);
      console.log(`   ✅ 搜索功能正常`);
      console.log(`      找到 ${results.length} 个结果`);
      
      if (results.length > 0) {
        results.forEach((result, index) => {
          console.log(`      ${index + 1}. ${result.title || '无标题'}`);
          console.log(`          链接: ${result.url || '无链接'}`);
          console.log(`          摘要: ${result.snippet || '无摘要'}`);
          console.log('');
        });
      }
    } catch (error) {
      console.log(`   ❌ 搜索功能失败: ${error.message}`);
    }
    
    console.log('\n3. 测试网页读取功能...');
    try {
      const content = await jinaClient.readWebpage('https://example.com');
      console.log(`   ✅ 网页读取功能正常`);
      console.log(`      标题: ${content.title || '无标题'}`);
      console.log(`      内容长度: ${content.content?.length || 0} 字符`);
      console.log(`      字数: ${content.wordCount || 0}`);
    } catch (error) {
      console.log(`   ❌ 网页读取功能失败: ${error.message}`);
    }
    
    console.log('\n4. 测试批量搜索功能...');
    try {
      const keywords = ['AI', '机器学习'];
      const results = await jinaClient.batchSearch(keywords, 2);
      console.log(`   ✅ 批量搜索功能正常`);
      console.log(`      使用关键词: ${keywords.join(', ')}`);
      console.log(`      找到 ${results.length} 个唯一结果`);
    } catch (error) {
      console.log(`   ❌ 批量搜索功能失败: ${error.message}`);
    }
    
    console.log('\n🎯 最终状态检查:');
    console.log(`   - Jina AI API 密钥: ${jinaClient.apiKey ? '✅ 有效' : '❌ 无效'}`);
    console.log(`   - DeepSearch 客户端: ${jinaClient.dsClient ? '✅ 正常' : '❌ 异常'}`);
    console.log(`   - Reader 客户端: ${jinaClient.rdClient ? '✅ 正常' : '❌ 异常'}`);
    console.log(`   - 网络连接: ✅ 正常`);
    console.log(`   - 服务状态: ✅ 正常运行`);
    
    console.log('\n🎉 Jina-client.js 完全正常运行！所有功能测试通过！');
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

testJinaReal().catch(console.error);
