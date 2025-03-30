import os
import random
import requests
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from textblob import TextBlob
import warnings
import json
import string  # 处理英文标点符号
import re  # 添加 re 模块来处理其他语言的标点符号
import logging  # 添加日志模块
from datetime import datetime
import time

# 创建 Flask 应用，指定新的静态文件和模板目录
app = Flask(__name__, 
    static_folder='../frontend/static',
    template_folder='../frontend/templates')

# 配置日志
class CustomFormatter(logging.Formatter):
    def format(self, record):
        if "=== 新的分析请求 ===" in str(record.msg):
            record.msg = f"\n{'='*50}\n{record.msg}"
        return super().format(record)

# 配置日志
logger = logging.getLogger(__name__)
handler = logging.StreamHandler()
handler.setFormatter(CustomFormatter('%(asctime)s - %(message)s'))
logger.handlers = [handler]
logger.setLevel(logging.INFO)

# 打印当前工作目录
logger.info("当前工作目录: %s", os.getcwd())

# 检查 .env 文件是否存在
env_path = os.path.join(os.getcwd(), '.env')
logger.info(".env 文件路径: %s", env_path)
logger.info(".env 文件是否存在: %s", os.path.exists(env_path))

# 如果文件存在，打印其内容
if os.path.exists(env_path):
    with open(env_path, 'r') as f:
        logger.info(".env 文件内容:")
        logger.info(f.read())

# 加载环境变量
load_dotenv(override=True)

# 获取环境变量
HUGGINGFACE_API_KEY = os.getenv('HUGGINGFACE_API_KEY')
PEXELS_API_KEY = os.getenv('PEXELS_API_KEY')

logger.info("环境变量加载完成")

logger.info("\n环境变量检查:")
logger.info("PEXELS_API_KEY: %s", PEXELS_API_KEY)

# 临时移除强制检查，改用默认值
if not PEXELS_API_KEY:
    logger.info("尝试使用默认值")
    PEXELS_API_KEY = "你的实际access_key"  # 请替换为你的实际 key

logger.info("HUGGINGFACE_API_KEY: %s", '已设置' if HUGGINGFACE_API_KEY else '未设置')
logger.info("PEXELS_API_KEY: %s", '已设置' if PEXELS_API_KEY else '未设置')
logger.info("PEXELS_API_KEY 值: %s...", PEXELS_API_KEY[:8]) # 只显示前8位，安全起见

# 直接忽略所有 urllib3 的警告
warnings.filterwarnings('ignore', category=Warning)

# 添加简单的内存缓存
image_cache = {}

# 定义情绪关键词映射
EMOTION_KEYWORDS = {
    # 爱与关系相关
    'love': ['love', 'romance', 'couple', 'affection', 'heart'],
    'caring': ['care', 'helping', 'support', 'gentle', 'kindness'],
    'admiration': ['admire', 'respect', 'amazing', 'wonderful', 'excellent'],
    'desire': ['desire', 'want', 'wish', 'longing', 'yearning'],
    
    # 快乐相关
    'joy': ['happy', 'joy', 'smile', 'laugh', 'cheerful'],
    'amusement': ['fun', 'playful', 'entertainment', 'humor', 'amusing'],
    'excitement': ['excited', 'thrill', 'energetic', 'dynamic', 'vibrant'],
    
    # 积极相关
    'gratitude': ['grateful', 'thankful', 'appreciation', 'blessing', 'touched'],
    'optimism': ['optimistic', 'hopeful', 'positive', 'promising', 'bright future'],
    'pride': ['proud', 'achievement', 'confidence', 'accomplishment', 'success'],
    'approval': ['approve', 'agree', 'support', 'endorse', 'acceptance'],
    'relief': ['relief', 'relaxed', 'calm', 'peaceful', 'settled'],
    
    # 悲伤相关
    'sadness': ['sad', 'sorrow', 'unhappy', 'melancholy', 'gloomy'],
    'grief': ['grief', 'loss', 'mourning', 'heartbreak', 'devastated'],
    'disappointment': ['disappointed', 'letdown', 'failed', 'unfulfilled', 'regret'],
    'remorse': ['remorse', 'guilt', 'sorry', 'apologetic', 'ashamed'],
    
    # 恐惧与焦虑相关
    'fear': ['fear', 'scared', 'terrified', 'horror', 'frightening'],
    'nervousness': ['nervous', 'anxious', 'worried', 'uneasy', 'tense'],
    'embarrassment': ['embarrassed', 'awkward', 'uncomfortable', 'shy', 'self-conscious'],
    
    # 愤怒相关
    'anger': ['angry', 'rage', 'fury', 'outrage', 'mad'],
    'annoyance': ['annoyed', 'irritated', 'bothered', 'frustrated', 'disturbed'],
    'disgust': ['disgust', 'repulsed', 'revolting', 'offensive', 'gross'],
    'disapproval': ['disapprove', 'disagree', 'reject', 'oppose', 'dislike'],
    
    # 认知相关
    'confusion': ['confused', 'puzzled', 'perplexed', 'uncertain', 'unclear'],
    'curiosity': ['curious', 'interested', 'intrigued', 'wondering', 'fascinated'],
    'realization': ['realize', 'understand', 'awareness', 'insight', 'revelation'],
    'surprise': ['surprised', 'amazed', 'astonished', 'unexpected', 'shocking'],
    
    # 中性
    'neutral': ['neutral', 'balanced', 'steady', 'normal', 'regular']
}

# 提取关键词函数
def extract_keywords(text):
    """使用 TextBlob 提取关键词"""
    text = re.sub(r'[^\w\s]', '', text)
    text = re.sub(r'[{}]'.format(string.punctuation), '', text)
    text = re.sub(r'[\u3000-\u303F\uFF00-\uFFEF]', '', text)
    
    blob = TextBlob(text)
    exclude_tags = {
        'IN', 'DT', 'CC', 'PRP', 'PRP$', 'WP', 'WP$',
        'CD', 'TO', 'UH', 'MD', 'EX', 'PDT', 'WDT', 'RP',
        'VB', 'VBD', 'VBG', 'VBN', 'VBP', 'VBZ',
        'BE', 'RB', 'RBR', 'RBS'
    }
    
    keywords = [word.lower() for word, tag in blob.tags 
               if (tag.startswith(('NN', 'JJ')) 
                   and tag not in exclude_tags 
                   and len(word) > 1)]
    
    return list(dict.fromkeys(keywords))

# 分析情绪的函数
def analyze_sentiment(text):
    """使用 HuggingFace 情绪分析模型"""
    api_url = "https://api-inference.huggingface.co/models/SamLowe/roberta-base-go_emotions"
    headers = {"Authorization": f"Bearer {HUGGINGFACE_API_KEY}"}
    data = {"inputs": text}
    max_retries = 3
    retry_delay = 5  # 秒

    for attempt in range(max_retries):
        try:
            response = requests.post(api_url, headers=headers, json=data)
            
            if response.status_code == 200:
                emotions = response.json()
                logger.info("1. 原始情绪分析结果:")
                if isinstance(emotions, list) and emotions:
                    for emotion in emotions[0]:
                        logger.info(f"   - {emotion['label']}: {emotion['score']:.3f}")
                    
                    # 保留得分大于阈值的所有情绪
                    significant_emotions = [
                        {"label": emotion["label"], "score": emotion["score"]}
                        for emotion in emotions[0]
                        if emotion["score"] > 0.05
                    ]
                    
                    logger.info("2. 显著情绪:")
                    for emotion in significant_emotions:
                        logger.info(f"   - {emotion['label']}: {emotion['score']:.3f}")
                    
                    return significant_emotions
                    
            # 检查是否是模型加载错误
            error_response = response.json()
            if "error" in error_response and "loading" in error_response["error"].lower():
                if attempt < max_retries - 1:  # 如果不是最后一次尝试
                    logger.info(f"模型正在加载，等待 {retry_delay} 秒后重试...")
                    time.sleep(retry_delay)
                    continue
            
            logger.error("情绪分析API错误: %s", response.text)
            # 如果无法获取情绪分析结果，返回默认的中性情绪
            return [{"label": "neutral", "score": 1.0}]
            
        except Exception as e:
            logger.error("情绪分析错误: %s", str(e))
            if attempt < max_retries - 1:
                logger.info(f"第 {attempt + 1} 次尝试失败，等待后重试...")
                time.sleep(retry_delay)
                continue
            # 所有重试都失败后，返回默认的中性情绪
            return [{"label": "neutral", "score": 1.0}]
    
    # 如果所有重试都失败，返回默认的中性情绪
    return [{"label": "neutral", "score": 1.0}]

# 获取图片函数（确保每次返回不同的图片）
def get_images_for_mood(text, emotion_weights, colors):
    """从 Pexels 获取图片并根据情绪权重排序"""
    logger.info("\n=== 图片检索和排序开始 ===")
    try:
        # 初始化搜索词列表
        search_terms = []
        
        # 过滤常见连接词
        stop_words = {'and', 'or', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with'}
        text_keywords = [word for word in text.lower().split() if word not in stop_words]
        
        # 处理颜色
        user_colors = []
        if colors:
            logger.info("用户选择的颜色:")
            for color in colors:
                if color:  # 只处理非空颜色值
                    logger.info(f"   - {color}")
                    user_colors.append(color)
                    rgb = hex_to_rgb(color)
                    logger.info(f"   - RGB值: {rgb}")
        
        # 添加文本关键词
        search_terms.extend(text_keywords)
        
        logger.info(f"1. 最终搜索关键词: {' '.join(search_terms)}")
        
        # 获取图片
        headers = {"Authorization": PEXELS_API_KEY}
        params = {
            "query": " ".join(search_terms),
            "per_page": 30
        }
        
        response = requests.get("https://api.pexels.com/v1/search", headers=headers, params=params)
        data = response.json()
        
        if "photos" not in data:
            logger.error("API 响应中没有找到图片")
            return []
            
        # 处理返回的图片
        images = []
        for photo in data["photos"]:
            img = {
                "url": photo["src"]["large"],
                "avg_color": photo.get("avg_color", ""),
                "desc": photo.get("alt", "").lower(),
                "title": photo.get("title", "").lower()
            }
            images.append(img)
        
        logger.info(f"2. 获取到 {len(images)} 张图片")
        
        # 计算图片得分
        logger.info("3. 图片评分过程:")
        
        # 计算文本匹配的图片数量
        text_match_count = sum(1 for img in images if any(word in img['desc'] or word in img['title'] for word in text_keywords))
        logger.info(f"文本匹配图片数量: {text_match_count}")
        
        # 根据文本匹配数量动态调整权重
        if text_match_count < 5:  # 如果文本匹配较少
            text_weight = 0.3  # 文本权重30%
            color_weight = 0.7  # 颜色权重70%
            logger.info("文本匹配较少，调整权重: 文本30%, 颜色70%")
        else:
            text_weight = 0.5  # 文本权重50%
            color_weight = 0.5  # 颜色权重50%
            logger.info("使用默认权重: 文本50%, 颜色50%")
        
        for img in images:
            # 初始化得分
            text_score = 0
            color_score = 0
            bonus_score = 0
            
            # 文本匹配得分
            text_matches = [word for word in text_keywords if word in img['desc'] or word in img['title']]
            text_score = len(text_matches) * 0.5
            
            # 颜色匹配得分
            if user_colors and img['avg_color']:
                for user_color in user_colors:
                    similarity = calculate_color_similarity(user_color, img['avg_color'])
                    color_score = max(color_score, similarity)
                    
                    # 颜色相似度阈值 0.5
                    if similarity > 0.5:
                        bonus_score = 0.2
            
            # 使用新的权重计算总分
            total_score = (text_score * text_weight) + (color_score * color_weight) + bonus_score
            img['relevance'] = total_score
            
            if text_matches or color_score > 0:
                logger.info(f"   - 图片: {img['url']}")
                logger.info(f"   - 文本匹配: {text_matches}")
                logger.info(f"   - 颜色相似度: {color_score:.2f}")
                if bonus_score > 0:
                    logger.info(f"   - 颜色额外加分(>0.5): {bonus_score:.2f}")
                logger.info(f"   - 总得分: {total_score:.2f}")
        
        # 按相关性排序
        sorted_images = sorted(images, key=lambda x: x['relevance'], reverse=True)
        
        logger.info(f"\n4. 排序完成，返回 {len(sorted_images)} 张图片")
        return [img['url'] for img in sorted_images]
        
    except Exception as e:
        logger.error("获取图片错误: %s", str(e))
        return []

def hex_to_rgb(hex_color):
    """将十六进制颜色转换为RGB值"""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def calculate_color_similarity(color1, color2):
    """计算两个颜色的相似度（返回0-1之间的值）"""
    try:
        # 转换为RGB值
        rgb1 = hex_to_rgb(color1)
        rgb2 = hex_to_rgb(color2)
        
        # 计算欧几里得距离
        distance = sum((a - b) ** 2 for a, b in zip(rgb1, rgb2)) ** 0.5
        
        # 将距离转换为相似度（0-1之间）
        max_distance = (255 ** 2 * 3) ** 0.5  # RGB空间中的最大距离
        similarity = 1 - (distance / max_distance)
        
        return similarity
    except Exception as e:
        logger.error(f"颜色相似度计算错误: {str(e)}")
        return 0

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    logger.info("\n{'='*50}\n=== 新的分析请求 ===")
    try:
        data = request.json
        user_input = data.get('text', '')
        selected_colors = data.get('colors', [])
        adjusted_sentiments = data.get('adjustedSentiments', None)
        is_new_input = not data.get('keywords', None)
        
        logger.info(f"输入文本: {user_input}")
        logger.info(f"选择的颜色: {selected_colors}")  # 添加颜色日志
        
        if is_new_input:
            logger.info("进行新文本分析")
            sentiment = analyze_sentiment(user_input)
            keywords = extract_keywords(user_input)
            images = get_images_for_mood(user_input, sentiment, selected_colors)
        else:
            logger.info("使用调整后的情绪进行搜索")
            keywords = data.get('keywords', [])
            sentiment = adjusted_sentiments
            images = get_images_for_mood(user_input, adjusted_sentiments, selected_colors)
        
        logger.info("请求处理完成")
        logger.info("{'='*50}")
        
        return jsonify({
            "sentiment": sentiment,
            "keywords": keywords,
            "images": images
        })
        
    except Exception as e:
        logger.error("错误: %s", str(e))
        return jsonify({"error": str(e), "images": []}), 500

@app.route('/vibe-studio')
def vibe_studio():
    return render_template('vibe_studio.html')

@app.route('/api/typography/search', methods=['POST'])
def search_typography():
    """独立的字体图片检索接口"""
    try:
        data = request.get_json()
        font_style = data.get('font_style')
        
        logger.info("\n=== 字体图片检索请求 ===")
        logger.info(f"字体风格: {font_style}")
        
        # 字体风格对应的搜索关键词
        style_keywords = {
            'playful': 'playful typography fun lettering',
            'elegant': 'elegant typography classic calligraphy',
            'modern': 'modern typography minimal design',
            'bold': 'bold typography strong lettering',
            'creative': 'creative typography artistic lettering'
        }
        
        # 使用 Pexels API 搜索字体相关图片
        headers = {"Authorization": PEXELS_API_KEY}
        query = style_keywords.get(font_style, 'typography')
        
        params = {
            "query": query,
            "per_page": 15,
            "orientation": "landscape"
        }
        
        response = requests.get(
            "https://api.pexels.com/v1/search",
            headers=headers,
            params=params
        )
        
        if response.status_code == 200:
            data = response.json()
            if "photos" in data:
                images = [{
                    'url': photo['src']['large'],
                    'title': photo.get('alt', 'Typography Design'),
                    'id': str(photo['id']),
                    'description': photo.get('alt', 'Typography Design')
                } for photo in data['photos']]
                
                logger.info(f"成功获取 {len(images)} 张图片")
                return jsonify({
                    'status': 'success',
                    'images': images
                })
            
        logger.error("API 响应中没有找到图片")
        return jsonify({
            'status': 'error',
            'message': 'No images found'
        }), 404
        
    except Exception as e:
        logger.error(f"字体图片检索错误: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.after_request
def add_header(response):
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '-1'
    return response

if __name__ == '__main__':
    logger.info("启动服务器")
    app.run(debug=True, port=5001)  # 改用 5001 端口