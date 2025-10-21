# 数字员工夜间抓取系统 - 安装和使用指南

## 🚀 系统概述

数字员工夜间抓取系统是一个基于 Node.js 的自动化系统，使用 Jina AI 和 Deepseek AI 实现夜间自动抓取 AI 动态并生成智能报告。

## 📋 系统要求

- Node.js 16.0 或更高版本
- npm 或 yarn 包管理器
- Jina AI API 密钥
- Deepseek AI API 密钥

## 🔧 安装步骤

### 1. 克隆或下载项目

```bash
# 如果从 Git 仓库克隆
git clone <repository-url>
cd digital-worker

# 或者直接使用当前目录
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制环境变量模板文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填写您的 API 密钥和配置：

```env
# Jina AI 配置
JINA_API_KEY=your_jina_api_key_here

# Deepseek AI 配置
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_MODEL=deepseek-chat

# 飞书推送配置
FEISHU_WEBHOOK_URL=https://open.feishu.cn/open-apis/bot/v2/hook/cf30d1da-50a8-4396-adc3-e02cf893ce78

# Slack 推送配置（可选）
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/your/webhook/url
SLACK_CHANNEL=#ai-news

# 系统配置
CRON_SCHEDULE=0 23 * * *  # 每晚 23:00 执行
MAX_RESULTS=10            # 最大搜索结果数
MAX_CONCURRENT=3          # 最大并发数
REQUEST_TIMEOUT=30000     # 请求超时时间(毫秒)

# 日志配置
LOG_LEVEL=info
LOG_FILE=logs/digital-worker.log
```

### 4. 配置搜索关键词

编辑 `config/keywords.json` 文件，自定义您关注的 AI 领域关键词：

```json
{
  "keywords": [
    "AI 前沿",
    "大型模型动态", 
    "技术趋势",
    "产品动向",
    "生态事件",
    "人工智能发展",
    "机器学习",
    "深度学习",
    "自然语言处理",
    "计算机视觉",
    "大语言模型",
    "生成式AI",
    "AI应用",
    "AI创业",
    "AI投资"
  ]
}
```

### 5. 创建必要目录

```bash
npm run setup
```

或者手动创建：

```bash
mkdir -p logs data/cache data/reports
```

## 🧪 测试系统

### 快速测试（推荐）

验证系统结构和配置：

```bash
node src/test.js quick
```

### 完整测试

需要配置 API 密钥后运行：

```bash
node src/test.js full
```

## 🚀 运行系统

### 1. 开发模式

```bash
npm run dev
```

### 2. 生产模式

```bash
npm start
```

### 3. 手动执行

```bash
node src/index.js manual
```

## 📊 系统功能

### 核心流程

1. **定时触发** - 每晚 23:00 自动执行
2. **内容检索** - 使用 Jina AI 搜索最新 AI 相关内容
3. **内容抓取** - 获取并净化网页内容
4. **智能处理** - 使用 Deepseek AI 进行摘要和分类
5. **报告生成** - 生成结构化的 Markdown 报告
6. **通知推送** - 通过飞书/Slack 发送报告

### 报告格式

系统生成的报告包含以下部分：

- **夜报概览** - 抓取时间、关键词列表、结果统计
- **核心要点** - 3-5 点要点型摘要
- **分类汇总** - 按技术趋势/产品动向/生态事件分类
- **参考链接** - 所有抓取文章的原始链接

## 🔧 系统管理

### 查看系统状态

```bash
node src/index.js status
```

### 健康检查

```bash
node src/index.js health
```

### 停止系统

使用 `Ctrl+C` 优雅停止系统。

## 📁 文件结构

```
digital-worker/
├── src/                    # 源代码
│   ├── modules/           # 核心功能模块
│   │   ├── jina-client.js    # Jina AI 客户端
│   │   ├── deepseek-client.js  # Deepseek AI 客户端
│   │   ├── processor.js      # 内容处理器
│   │   ├── notifier.js       # 通知推送器
│   │   └── scheduler.js      # 定时调度器
│   ├── utils/             # 工具函数
│   │   ├── logger.js         # 日志工具
│   │   ├── config.js         # 配置管理
│   │   └── helpers.js        # 辅助函数
│   ├── index.js           # 主程序入口
│   └── test.js            # 测试文件
├── config/                # 配置文件
│   ├── keywords.json      # 搜索关键词配置
│   └── templates.json     # 报告模板配置
├── data/                  # 数据存储
│   ├── cache/             # 缓存数据
│   └── reports/           # 历史报告
├── logs/                  # 日志文件
├── package.json           # 项目依赖
├── .env.example           # 环境变量模板
├── README.md              # 项目说明
└── SETUP_GUIDE.md         # 本指南
```

## 🔍 故障排除

### 常见问题

1. **API 密钥错误**
   - 检查 `.env` 文件中的 API 密钥是否正确
   - 确认 API 密钥有足够的权限和额度

2. **依赖包安装失败**
   - 删除 `node_modules` 文件夹和 `package-lock.json`
   - 重新运行 `npm install`

3. **权限问题**
   - 确保对 `logs/` 和 `data/` 目录有写入权限

4. **网络连接问题**
   - 检查网络连接
   - 确认防火墙设置允许外部 API 调用

### 查看日志

系统日志保存在 `logs/digital-worker.log` 文件中，可以查看详细运行信息。

## 📞 技术支持

如果遇到问题，请：

1. 查看日志文件获取详细错误信息
2. 检查 API 密钥和配置是否正确
3. 运行测试验证系统功能
4. 查看 GitHub Issues（如果有的话）

## 📄 许可证

MIT License

---

**祝您使用愉快！** 🎉
