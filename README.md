# Moodbored - 情绪板生成器

Moodbored 是一个基于 Flask 的网页应用。本项目以情绪和语义线索为驱动，帮助用户生成相应的情绪板。该项目为基于大语言模型的自主原型实验，功能与交互仍在持续探索中，当前版本仅做技术表达与系统能力验证用途。

## 功能特点

- 🎨 基于文本的情绪分析和图片生成
- 🎯 支持颜色选择和字体风格定制
- 💖 个人收藏夹功能
- 🔍 智能图片搜索和排序
- 📱 响应式设计，支持多设备访问
  
## 🧠 Motivation

Moodbored 并非商业交付型项目，而是一次关于“情绪 - 语言 - 内容行为”三者之间关系的结构性探索。我尝试在非标准开发路径下，以自然语言作为调度主轴，自行完成 prompt 构建、可视反馈与流程联调的原型实现。这一项目仍在追求完整度，目前更强调如何通过轻量系统反映思维架构、交互假设与模型调用路径的设计能力。

## 技术栈

- 后端：Flask (Python)
- 前端：HTML5, CSS3, JavaScript
- API：HuggingFace, Pexels
-情绪分析模型：distilbert-base-uncased-finetuned-sst-2

社科选型：
- Ekman的基础情绪理论
- 社会情绪的研究
- 认知评价理论
- 自我意识情绪理论
  
## 安装说明

1. 克隆项目到本地：
```bash
git clone https://github.com/yourusername/moodbored.git
cd moodbored
```

2. 创建并激活虚拟环境：
```bash
# 创建虚拟环境
python -m venv venv

# 在 macOS/Linux 上激活虚拟环境
source venv/bin/activate

# 在 Windows 上激活虚拟环境
# venv\Scripts\activate
```

3. 安装后端依赖：
```bash
cd backend
pip install -r requirements.txt
```

4. 配置环境变量：
在 `backend` 目录下创建 `.env` 文件，添加以下配置：
```
HUGGINGFACE_API_KEY=your_huggingface_api_key
PEXELS_API_KEY=your_pexels_api_key
```

## 运行项目

1. 确保虚拟环境已激活，然后启动后端服务器：
```bash
# 如果还没激活虚拟环境
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate  # Windows

cd backend
python app.py
```

2. 在浏览器中访问：
```
http://localhost:5001
```

## 使用说明

1. 在主页输入描述你想要的情绪或场景
2. 选择合适的颜色和字体风格
3. 点击提交按钮生成情绪板
4. 选择喜欢的图片添加到收藏夹
5. 在 Vibe Studio 中管理你的收藏

## 目录结构

```
moodbored/
├── backend/           # Flask 后端应用
├── frontend/         # 前端资源文件
│   ├── static/      # 静态资源
│   └── templates/   # HTML 模板
├── screenshots/      # 项目截图
├── README.md        # 项目说明
├── TODO.md          # 开发计划
└── known_issues.md  # 已知问题
```

## 贡献指南

欢迎提交 Issue 和 Pull Request 来帮助改进项目。

## ⚠️ Known Issues

- 情绪解析基于一定的规则匹配，尚未建立鲁棒分类逻辑
- 缺乏正式的数据库或身份管理机制，仅用于原型展示  
- 前端 UI 构建仍处于原始阶段，主要服务逻辑验证
- Typography Gallery仍存在一定的调用问题，正在修复中
- 正在寻找用K-means替代avg_color进行色彩分析的方法

- 另外，如果你注意到了代码中bored和正式表述board的区分，没关系，那是我立项之初保留的谐音梗

## 📌 License

本项目为个人自研的实验性原型系统，欢迎查看、评估或交流思路。当前版本并不适用于商业部署或直接复用，所有内容仅作研究性展示与技术结构表达使用。
