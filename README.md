# 数字员工夜间抓取系统

一个基于 Node.js 的自动化系统，使用 Jina AI 和 Deepseek AI 实现夜间自动抓取 AI 动态并生成智能报告。

## 功能特性

- 🕒 **定时抓取**：每晚 23:00 自动执行抓取任务
- 🔍 **智能检索**：使用 Jina AI 搜索最新 AI 相关内容
- 📄 **内容净化**：自动去除广告和样式噪声，保留核心内容
- 🧠 **智能摘要**：使用 Deepseek AI 进行内容摘要和分类
- 📊 **报告生成**：生成结构化的 Markdown 报告
- 📧 **多渠道推送**：支持邮件和飞书通知

## 系统架构

```
digital-worker/
├── src/
│   ├── modules/          # 核心功能模块
│   ├── utils/            # 工具函数
│   └── index.js          # 主入口
├── config/               # 配置文件
├── data/                 # 数据存储
├── logs/                 # 日志文件
└── package.json          # 项目依赖
```

## 核心模块

1. **调度器 (scheduler)** - 定时触发任务
2. **Jina 客户端 (jina-client)** - 网页检索和抓取
3. **Deepseek 客户端 (deepseek-client)** - 智能摘要和分类
4. **处理器 (processor)** - 内容处理和聚合
5. **报告器 (reporter)** - 报告生成
6. **通知器 (notifier)** - 推送通知

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
复制 `.env.example` 为 `.env` 并填写您的 API 密钥：
```bash
cp .env.example .env
```

### 3. 运行系统
```bash
# 开发模式
npm run dev

# 生产模式
npm start

# 单次测试运行
npm run test
```

## 配置说明

### 环境变量
- `JINA_API_KEY` - Jina AI API 密钥
- `DEEPSEEK_API_KEY` - Deepseek AI API 密钥
- `EMAIL_CONFIG` - 邮件推送配置
- `FEISHU_WEBHOOK_URL` - 飞书 Webhook URL

### 关键词配置
在 `config/keywords.json` 中配置搜索关键词：
```json
{
  "keywords": ["AI 前沿", "大型模型动态", "技术趋势", "产品动向", "生态事件"]
}
```

## 报告格式

系统生成的报告包含以下部分：
- 前言（抓取时间、关键词列表）
- 分类汇总（技术趋势/产品动向/生态事件）
- 详细要点（3-5 点摘要）
- 参考链接

## 监控和日志

- 日志文件存储在 `logs/` 目录
- 历史报告存储在 `data/reports/` 目录
- 支持失败重试和异常告警

## 许可证

MIT License
# cangku1
