/**
 * 简单测试 Jina API 连接
 */

const configManager = require('./src/utils/config');
const axios = require('axios');

async function testJinaAPI() {
  console.log('开始简单测试 Jina API 连接...\n');
  
  try {
    // 初始化配置管理器
    await configManager.init();
    
    const apiKey = configManager.get('JINA_API_KEY');
    console.log(`1. API 密钥检查: ${apiKey ? '已配置' : '未配置'}`);
    if (!apiKey) {
      console.log('❌ JINA_API_KEY 未配置');
      return;
    }
    
    console.log(`2. API 密钥前几位: ${apiKey.slice(0, 8)}...`);
    
    // 测试 Jina 搜索功能
    console.log('\n3. 测试 Jina 搜索...');
    try {
      const searchClient = axios.create({
        baseURL: 'https://s.jina.ai',
        timeout: 30000,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      const response = await searchClient.post('/', {
        q: '人工智能',
        num: 1,
        gl: 'US'
      }, {
        headers: {
          'X-No-Cache': 'true',
          'X-With-Links-Summary': 'true',
          'X-Engine': 'direct'
        }
      });
      
      console.log('✅ Jina 搜索测试成功');
      console.log(`   状态码: ${response.status}`);
      console.log(`   结果数量: ${response.data?.data?.length || 0}`);
      
    } catch (error) {
      console.log('❌ Jina 搜索测试失败');
      console.log(`   错误: ${error.message}`);
      if (error.response) {
        console.log(`   状态码: ${error.response.status}`);
        console.log(`   错误信息: ${JSON.stringify(error.response.data)}`);
      }
    }
    
    // 测试 Reader 功能
    console.log('\n4. 测试 Reader 功能...');
    try {
      const rdClient = axios.create({
        baseURL: 'https://r.jina.ai',
        timeout: 30000,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        }
      });
      
      const testUrl = 'https://example.com';
      const encodedUrl = encodeURIComponent(testUrl);
      const response = await rdClient.get(`/${encodedUrl}`);
      
      console.log('✅ Reader 测试成功');
      console.log(`   状态码: ${response.status}`);
      console.log(`   标题: ${response.data?.title || '无标题'}`);
      
    } catch (error) {
      console.log('❌ Reader 测试失败');
      console.log(`   错误: ${error.message}`);
      if (error.response) {
        console.log(`   状态码: ${error.response.status}`);
        console.log(`   错误信息: ${JSON.stringify(error.response.data)}`);
      }
    }
    
    console.log('\n测试完成！');
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

testJinaAPI().catch(console.error);
