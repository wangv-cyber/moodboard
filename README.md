# MoodBored - 情绪板生成器

MoodBored 是一个基于 Flask 的网页应用，可以根据用户输入的文本描述生成相应的情绪板。它使用先进的情感分析和图像检索技术，帮助用户创建个性化的视觉情绪展示。

## 功能特点

- 🎨 基于文本的情绪分析和图片生成
- 🎯 支持颜色选择和字体风格定制
- 💖 个人收藏夹功能
- 🔍 智能图片搜索和排序
- 📱 响应式设计，支持多设备访问

## 技术栈

- 后端：Flask (Python)
- 前端：HTML5, CSS3, JavaScript
- API：HuggingFace (情感分析), Pexels (图片资源)

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

## 许可证

MIT License 