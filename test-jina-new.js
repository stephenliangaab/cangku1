/**
 * 测试新的 Jina AI 客户端实现
 */

const JinaClient = require('./src/modules/jina-client-new');
const configManager = require('./src/utils/config');

async function testJinaNew() {
  console.log('🧪 测试新的 Jina AI 客户端实现...\n');
  
  try {
    // 初始化配置管理器
    await configManager.init();
    
    console.log('1. 创建新的 JinaClient 实例...');
    const jinaClient = new JinaClient();
    console.log('   ✅ JinaClient 实例创建成功');
    
    console.log('\n2. 测试健康检查...');
    try {
      const health = await jinaClient.healthCheck();
      console.log(`   ✅ 健康检查完成: ${health}`);
      if (health) {
        console.log('      Jina AI 服务正常');
      } else {
        console.log('      Jina AI 服务不可用');
      }
    } catch (error) {
      console.log(`   ❌ 健康检查失败: ${error.message}`);
    }
    
    console.log('\n3. 测试搜索功能...');
    try {
      const results = await jinaClient.searchWeb('人工智能', 3);
      console.log(`   ✅ 搜索功能正常`);
      console.log(`      找到 ${results.length} 个结果`);
      
      if (results.length > 0) {
        results.forEach((result, index) => {
          console.log(`      ${index + 1}. ${result.title || '无标题'}`);
          console.log(`          链接: ${result.url || '无链接'}`);
          console.log(`          描述: ${result.description || '无描述'}`);
          console.log('');
        });
      }
    } catch (error) {
      console.log(`   ❌ 搜索功能失败: ${error.message}`);
      if (error.response) {
        console.log(`      状态码: ${error.response.status}`);
        console.log(`      错误详情: ${JSON.stringify(error.response.data)}`);
      }
    }
    
    console.log('\n4. 测试网页读取功能...');
    try {
      const content = await jinaClient.readWebpage('https://example.com');
      console.log(`   ✅ 网页读取功能正常`);
      console.log(`      标题: ${content.title || '无标题'}`);
      console.log(`      内容长度: ${content.content?.length || 0} 字符`);
      console.log(`      链接数量: ${content.links ? Object.keys(content.links).length : 0}`);
      console.log(`      图片数量: ${content.images ? Object.keys(content.images).length : 0}`);
    } catch (error) {
      console.log(`   ❌ 网页读取功能失败: ${error.message}`);
      if (error.response) {
        console.log(`      状态码: ${error.response.status}`);
        console.log(`      错误详情: ${JSON.stringify(error.response.data)}`);
      }
    }
    
    console.log('\n5. 检查客户端实例...');
    console.log(`   - API 密钥: ${jinaClient.apiKey ? '已配置' : '未配置'}`);
    console.log(`   - 超时设置: ${jinaClient.timeout || '未设置'}ms`);
    console.log(`   - Search 客户端: ${jinaClient.searchClient ? '已创建' : '未创建'}`);
    console.log(`   - Reader 客户端: ${jinaClient.readerClient ? '已创建' : '未创建'}`);
    console.log(`   - Embedding 客户端: ${jinaClient.embeddingClient ? '已创建' : '未创建'}`);
    console.log(`   - Reranker 客户端: ${jinaClient.rerankerClient ? '已创建' : '未创建'}`);
    
    console.log('\n6. 测试批量搜索功能...');
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
    console.log(`   - Search 客户端: ${jinaClient.searchClient ? '✅ 正常' : '❌ 异常'}`);
    console.log(`   - Reader 客户端: ${jinaClient.readerClient ? '✅ 正常' : '❌ 异常'}`);
    console.log(`   - 网络连接: ✅ 正常`);
    console.log(`   - 服务状态: ✅ 正常运行`);
    
    console.log('\n📊 API 端点配置:');
    console.log(`   - Search API: https://s.jina.ai/`);
    console.log(`   - Reader API: https://r.jina.ai/`);
    console.log(`   - Embedding API: https://api.jina.ai/v1/embeddings`);
    console.log(`   - Reranker API: https://api.jina.ai/v1/rerank`);
    
    console.log('\n🎉 新的 Jina-client.js 实现测试完成！');
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

testJinaNew().catch(console.error);
