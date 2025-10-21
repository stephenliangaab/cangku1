/**
 * 测试 Deepseek API 连接
 */

const ClaudeClient = require('./src/modules/deepseek-client');

async function testDeepseek() {
  console.log('🚀 开始测试 Deepseek API 连接...\n');

  try {
    // 检查环境变量
    console.log('📋 环境变量检查:');
    console.log('- DEEPSEEK_API_KEY:', process.env.DEEPSEEK_API_KEY ? '已设置' : '未设置');
    console.log('- DEEPSEEK_MODEL:', process.env.DEEPSEEK_MODEL || '使用默认值 deepseek-chat');
    console.log('');

    // 初始化客户端
    console.log('🔄 正在初始化 DeepseekClient...');
    const client = new ClaudeClient();
    console.log('✅ DeepseekClient 初始化成功\n');

    // 健康检查
    console.log('🩺 正在进行健康检查...');
    const health = await client.healthCheck();
    if (health) {
      console.log('✅ Deepseek API 健康检查通过\n');
    } else {
      console.log('❌ Deepseek API 健康检查失败\n');
      return;
    }

    // 测试简单消息
    console.log('💬 测试简单消息发送...');
    const response = await client.sendMessage('你好，请用一句话介绍你自己。', {
      maxTokens: 100,
      temperature: 0.1
    });
    console.log('🤖 Deepseek 回复:', response);
    console.log('');

    // 测试摘要生成
    console.log('📝 测试摘要生成功能...');
    const testArticles = [
      {
        title: 'AI技术发展趋势',
        content: '近年来，人工智能技术在自然语言处理、计算机视觉等领域取得了显著进展。大语言模型如GPT系列、Claude系列和Deepseek系列不断推陈出新，性能持续提升。'
      },
      {
        title: 'AI产品动态',
        content: '多家公司发布了新的AI产品，包括智能助手、代码生成工具和内容创作平台。这些产品正在改变人们的工作和生活方式。'
      }
    ];

    const summary = await client.generateSummary(testArticles);
    console.log('📄 生成的摘要:');
    console.log(summary);
    console.log('');

    console.log('🎉 所有测试通过！Deepseek API 集成成功！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('详细错误:', error);
  }
}

// 运行测试
testDeepseek();
