/**
 * 测试网络连接问题
 */

const https = require('https');
const http = require('http');

async function testNetwork() {
  console.log('🌐 测试网络连接问题...\n');
  
  // 测试 HTTP 连接
  console.log('1. 测试 HTTP 连接 (非加密):');
  try {
    const httpResult = await new Promise((resolve, reject) => {
      const req = http.request('http://httpbin.org/get', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data) }));
      });
      req.on('error', reject);
      req.setTimeout(10000, () => reject(new Error('HTTP 请求超时')));
      req.end();
    });
    console.log('   ✅ HTTP 连接成功');
    console.log(`      状态码: ${httpResult.status}`);
  } catch (error) {
    console.log('   ❌ HTTP 连接失败');
    console.log(`      错误: ${error.message}`);
  }
  
  // 测试 HTTPS 连接
  console.log('\n2. 测试 HTTPS 连接 (加密):');
  try {
    const httpsResult = await new Promise((resolve, reject) => {
      const req = https.request('https://httpbin.org/get', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data) }));
      });
      req.on('error', reject);
      req.setTimeout(10000, () => reject(new Error('HTTPS 请求超时')));
      req.end();
    });
    console.log('   ✅ HTTPS 连接成功');
    console.log(`      状态码: ${httpsResult.status}`);
  } catch (error) {
    console.log('   ❌ HTTPS 连接失败');
    console.log(`      错误: ${error.message}`);
    
    if (error.message.includes('SSL') || error.message.includes('TLS')) {
      console.log('      💡 问题: SSL/TLS 握手失败');
    } else if (error.message.includes('timeout')) {
      console.log('      💡 问题: 连接超时');
    }
  }
  
  // 测试 Node.js 版本兼容性
  console.log('\n3. Node.js 环境检查:');
  console.log(`   - Node.js 版本: ${process.version}`);
  console.log(`   - OpenSSL 版本: ${process.versions.openssl}`);
  
  // 测试系统证书
  console.log('\n4. 系统证书检查:');
  try {
    const certs = https.globalAgent.options.ca || '使用系统默认证书';
    console.log(`   - 证书配置: ${typeof certs === 'string' ? certs : '自定义证书'}`);
  } catch (error) {
    console.log(`   - 证书检查错误: ${error.message}`);
  }
  
  console.log('\n5. 问题分析:');
  console.log('   - 如果 HTTP 成功但 HTTPS 失败: SSL/TLS 配置问题');
  console.log('   - 如果两者都失败: 网络连接问题');
  console.log('   - 如果两者都成功: Jina AI 特定问题');
  
  console.log('\n测试完成！');
}

testNetwork().catch(console.error);
