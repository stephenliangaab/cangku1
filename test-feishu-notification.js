/**
 * 测试飞书通知功能
 * 验证完整报告内容发送功能
 */

const Notifier = require('./src/modules/notifier');
const configManager = require('./src/utils/config');
const logger = require('./src/utils/logger');

async function testFeishuNotification() {
  console.log('🚀 开始测试飞书通知功能...\n');
  
  try {
    // 初始化配置管理器
    await configManager.init();
    
    console.log('1. 初始化通知器...');
    const notifier = new Notifier();
    console.log('   ✅ 通知器初始化完成');
    
    // 创建一个测试报告
    const testReport = {
      title: '🧪 测试报告 - AI 动态夜报',
      content: `## 📊 夜报概览

**抓取时间**: 2025/10/04 00:53:00  
**搜索关键词**: AI 前沿, 技术趋势, 产品动向  
**抓取结果**: 共找到 5 篇文章，筛选出 5 篇优质内容

---

## 🎯 核心要点

基于提供的5篇文章内容，以下是当前AI领域最重要的动态和发展趋势要点摘要：

---

### **1. 生成式AI应用场景快速扩展**
- 通过提示词即可实现完整前后端应用的全栈开发平台出现
- Google Home等智能家居系统全面接入Gemini，实现硬件软件深度整合

### **2. 大模型训练效率与架构持续优化**
- MoE（混合专家）模型通过动态样本放置技术显著提升大规模训练效率
- 研究重点从单纯扩大参数规模转向提升模型训练效率和资源利用率

### **3. 计算机视觉市场呈现爆发式增长**
- 预计到2031年，全球计算机视觉市场规模将从2022年的1260亿美元增至3860亿美元
- 制造业、能源、汽车等行业广泛应用计算机视觉进行质量检测和流程优化

---

**总结**：当前AI发展呈现出效率优化、应用深化、市场规模化三大特征。

## 🔬 技术趋势

### 动态样本放置加速MoE大规模训练
• 动态样本放置等新技术正加速混合专家模型的大规模训练
• 研究重点从单纯扩大参数规模转向提升模型训练效率和资源利用率

来源: https://zhuanlan.zhihu.com/p/1899634037368264695

## 🚀 产品动向

### Shopify 2025年热销产品预测
• 2025年热销的20种在线产品清单
• 结合AI工具辅助产品调研和商业决策

来源: https://www.shopify.com/zh/blog/trending-products

## 🌐 生态事件

### 德勤技术趋势2025报告
• 分析2025年最重要的技术趋势
• 涵盖AI、云计算、网络安全等多个领域

来源: https://www.deloitte.com/cn/zh/Industries/technology/perspectives/tech-trends-2025.html

## 🔗 参考链接

- [《技术趋势2025》报告 | 德勤中国](https://www.deloitte.com/cn/zh/Industries/technology/perspectives/tech-trends-2025.html)
- [畅销商品清单：2025年热销的20种在线产品（附营销技巧） - Shopify 中国](https://www.shopify.com/zh/blog/trending-products)
- [ICLR 25好文：动态样本放置加速MoE大规模训练](https://zhuanlan.zhihu.com/p/1899634037368264695)`,
      timestamp: '2025/10/04 00:53:00',
      totalArticles: 5,
      categories: {
        '技术趋势': 2,
        '产品动向': 1,
        '生态事件': 2
      }
    };
    
    console.log('\n2. 发送飞书通知...');
    console.log('   - 包含完整报告内容');
    console.log('   - 包含分类统计信息');
    console.log('   - 包含所有参考链接');
    
    const result = await notifier.sendFeishu(testReport);
    
    console.log('\n3. 测试结果:');
    if (result) {
      console.log('   ✅ 飞书通知发送成功');
      console.log('   - 完整报告内容已发送到飞书');
      console.log('   - 包含所有章节和详细信息');
    } else {
      console.log('   ❌ 飞书通知发送失败');
      console.log('   - 请检查飞书 Webhook 配置');
    }
    
    console.log('\n🎉 飞书通知功能测试完成！');
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
    console.log('\n❌ 测试失败，请检查系统配置');
  }
}

testFeishuNotification().catch(console.error);
