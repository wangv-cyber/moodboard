// 在 main.js 开头添加调试日志
console.log('main.js 加载');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM加载完成');
    
    // 初始化变量
    const selectedImages = new Set();
    const selectedTags = new Set();
    let currentSentiments = [];  // 只在这里声明一次
    
    // 获取DOM元素
    const form = document.getElementById('text-form');
    const textInput = document.getElementById('text-input');
    
    // 颜色选择器相关
    const customPicker = document.getElementById('custom-picker');
    const colorPicker = document.getElementById('main-color-picker');
    const colorPreview = customPicker ? customPicker.querySelector('.color-preview') : null;
    
    // 清除之前可能存在的事件监听器
    const colorPickers = colorPicker ? [colorPicker] : [];
    
    // 检查必要元素
    if (!customPicker || !colorPicker || !colorPreview) {
        console.error('颜色选择器必要元素缺失');
        return;
    }
    
    console.log('DOM元素状态:', {
        form: !!form,
        textInput: !!textInput,
        customPicker: !!customPicker,
        colorPicker: !!colorPicker,
        colorPickers: colorPickers.length,
        colorPreview: !!colorPreview
    });
    
    // 添加字体选择器的代码
    const selector = document.querySelector('#font-style-selector');
    const preview = document.querySelector('#font-preview');

    if (selector && preview) {
        selector.addEventListener('change', function() {
            // 移除所有现有的字体类
            preview.className = '';
            // 添加新选择的字体类
            if (this.value) {
                preview.classList.add(this.value);
            }
        });
    }
    
    // 恢复上次搜索的函数
    function restoreLastSearch() {
        const lastSearch = localStorage.getItem('lastSearch');
        if (lastSearch) {
            const data = JSON.parse(lastSearch);
            if (data.userInput) {
                textInput.value = data.userInput;
            }
            if (data.selectedImages) {
                data.selectedImages.forEach(url => selectedImages.add(url));
            }
            if (data.selectedTags) {
                data.selectedTags.forEach(tag => selectedTags.add(tag));
            }
            displaySearchResults(data);
        }
    }
    
    // 显示搜索结果的函数
    function displaySearchResults(data) {
        // 使用已经定义的 currentSentiments，不要重新声明
        currentSentiments = data.sentiment || [];
        // ... 其余显示逻辑 ...
    }
    
    // 检查是否是从收藏夹返回
    const isFromFavorites = sessionStorage.getItem('fromFavorites');
    
    if (!isFromFavorites) {
        // 只有不是从收藏夹返回时才清除数据
        clearMainPageData();
    } else {
        // 从收藏夹返回时恢复数据
        restoreLastSearch();
        // 清除标记
        sessionStorage.removeItem('fromFavorites');
    }
    
    // 新增：清除主页面数据的函数
    function clearMainPageData() {
        // 清除输入框
        if (textInput) {
            textInput.value = '';
        }
        
        // 清除标签区域
        const keywordsDiv = document.getElementById('keywords');
        const sentimentDiv = document.getElementById('sentiment');
        const selectedTagsDiv = document.getElementById('selected-tags');
        
        if (keywordsDiv) keywordsDiv.innerHTML = '';
        if (sentimentDiv) sentimentDiv.innerHTML = '';
        if (selectedTagsDiv) selectedTagsDiv.innerHTML = '';
        
        // 清除图片容器
        const imageContainer = document.getElementById('image-container');
        if (imageContainer) {
            imageContainer.innerHTML = '';
        }
        
        // 清除选中状态
        selectedImages.clear();
        selectedTags.clear();
        
        // 移除lastSearch数据
        localStorage.removeItem('lastSearch');
    }
    
    // 页面加载时恢复上次的搜索结果和选中状态
    restoreLastSearch();
    
    // 初始化颜色选择器状态
    function updateColorPickersState() {
        const hasText = textInput && textInput.value.trim() !== '';
        colorPickers.forEach(picker => {
            if (picker) {
                picker.disabled = !hasText;
            }
        });
    }

    // 清除之前的事件监听器
    const newCustomPicker = customPicker.cloneNode(true);
    customPicker.parentNode.replaceChild(newCustomPicker, customPicker);
    
    const newColorPicker = colorPicker.cloneNode(true);
    colorPicker.parentNode.replaceChild(newColorPicker, colorPicker);

    // 重新获取新的元素引用
    const updatedCustomPicker = document.getElementById('custom-picker');
    const updatedColorPicker = document.getElementById('main-color-picker');
    const updatedColorPreview = updatedCustomPicker.querySelector('.color-preview');

    // 添加新的事件监听器
    updatedCustomPicker.style.cursor = 'pointer';
    
    // 点击事件
    updatedCustomPicker.addEventListener('click', function(e) {
        e.preventDefault();
        if (!updatedColorPicker.disabled) {
            updatedColorPicker.click();
        }
    });

    // 颜色变化事件 - 只添加一次
    updatedColorPicker.addEventListener('input', function(e) {
        const selectedColor = e.target.value;
        console.log('选择的颜色:', selectedColor);
        
        updatedColorPreview.style.backgroundColor = selectedColor;
        updatedColorPreview.classList.remove('empty');
        this.dataset.selected = 'true';
    });

    // 初始化状态
    updateColorPickersState();

    // 文本输入监听
    if (textInput) {
        textInput.addEventListener('input', updateColorPickersState);
    }

    // 表单提交处理
    if (form) {
        console.log('找到表单，添加提交事件监听器');
        form.addEventListener('submit', async function(e) {
            console.log('表单提交触发');
            e.preventDefault();
            const userInput = document.getElementById('text-input').value;
            const loadingDiv = document.getElementById('loading');
            
            if (!userInput.trim()) {
                alert('请输入文本');
                return;
            }
            
            try {
                loadingDiv.style.display = 'block';
                
                // 获取颜色值
                const selectedColor = updatedColorPicker.getAttribute('data-selected') === 'true' ? 
                                    [updatedColorPicker.value] : [];
                
                const requestBody = {
                    text: userInput,
                    colors: selectedColor
                };
                
                const response = await fetch('/analyze', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody)
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                // 更新显示
                displaySearchResults(data);
                saveSearchResults(data, userInput);
                
            } catch (error) {
                console.error('请求出错:', error);
                alert('处理请求时出错，请重试');
            } finally {
                loadingDiv.style.display = 'none';
            }
        });
    } else {
        console.error('未找到表单元素');
    }
    
    // 添加到收藏夹按钮处理
    const addToFavoritesBtn = document.getElementById('add-to-favorites');
    if (addToFavoritesBtn) {
        addToFavoritesBtn.addEventListener('click', () => {
            console.log('点击添加到收藏夹按钮');
            console.log('选中的图片数量:', selectedImages.size);
            
            if (selectedImages.size === 0) {
                alert('请先选择要收藏的图片');
                return;
            }
            
            const savedFavorites = localStorage.getItem('favorites');
            const favorites = savedFavorites ? JSON.parse(savedFavorites) : [];
            
            selectedImages.forEach(imageUrl => {
                if (!favorites.includes(imageUrl)) {
                    favorites.push(imageUrl);
                    console.log('添加图片到收藏:', imageUrl);
                }
            });
            
            localStorage.setItem('favorites', JSON.stringify(favorites));
            console.log('保存到收藏夹完成，总数:', favorites.length);
            
            // 清除选中状态
            selectedImages.clear();
            document.querySelectorAll('.image-checkbox').forEach(checkbox => {
                checkbox.checked = false;
            });
            
            alert('已添加到收藏夹');
        });
    }
    
    // 保存搜索结果和选中状态
    function saveSearchResults(data, userInput) {
        const searchResults = {
            keywords: data.keywords,
            sentiment: data.sentiment,
            images: data.images,
            userInput: userInput,
            selectedImages: Array.from(selectedImages),
            selectedTags: Array.from(selectedTags),
            timestamp: Date.now()
        };
        localStorage.setItem('lastSearch', JSON.stringify(searchResults));
    }
    
    // 保存选中状态
    function saveSelectedState() {
        const state = {
            selectedImages: Array.from(selectedImages),
            selectedTags: Array.from(selectedTags)
        };
        localStorage.setItem('selectedState', JSON.stringify(state));
    }
    
    // 显示搜索结果
    function displaySearchResults(data) {
        // 处理关键词
        if (data.keywords) {
            const keywordsDiv = document.getElementById('keywords');
            keywordsDiv.innerHTML = '';
            data.keywords.forEach(keyword => {
                keywordsDiv.appendChild(createClickableTag(keyword, 'keyword'));
            });
        }
        
        // 处理情绪标签
        if (data.sentiment) {
            const sentimentDiv = document.getElementById('sentiment');
            sentimentDiv.innerHTML = '';
            currentSentiments = data.sentiment;
            
            data.sentiment.forEach((emotion, index) => {
                const container = document.createElement('div');
                container.className = 'sentiment-tag-container';
                
                // 创建标签文本
                const label = document.createElement('span');
                label.className = 'sentiment-label';
                label.textContent = emotion.label;
                
                // 创建滑块容器
                const sliderContainer = document.createElement('div');
                sliderContainer.className = 'slider-container';
                
                // 创建滑块
                const slider = document.createElement('input');
                slider.type = 'range';
                slider.min = '0';
                slider.max = '100';
                slider.value = Math.round(emotion.score * 100);
                slider.className = 'sentiment-slider';
                
                // 创建值显示
                const value = document.createElement('span');
                value.className = 'slider-value';
                value.textContent = `${Math.round(emotion.score * 100)}%`;
                
                // 滑块值变化事件
                slider.addEventListener('input', function() {
                    value.textContent = `${this.value}%`;
                    currentSentiments[index].score = parseInt(this.value) / 100;
                });
                
                sliderContainer.appendChild(slider);
                sliderContainer.appendChild(value);
                
                container.appendChild(label);
                container.appendChild(sliderContainer);
                sentimentDiv.appendChild(container);
            });
        }
        
        // 处理图片
        if (data.images && data.images.length > 0) {
            displayImages(data.images);
        }
    }
    
    // 创建可点击标签
    function createClickableTag(text, type, score = null) {
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = score ? `${text} (${(score * 100).toFixed(1)}%)` : text;
        
        // 恢复标签选中状态
        if (selectedTags.has(text)) {
            tag.classList.add('selected');
        }
        
        tag.addEventListener('click', () => {
            if (selectedTags.has(text)) {
                selectedTags.delete(text);
                tag.classList.remove('selected');
            } else {
                selectedTags.add(text);
                tag.classList.add('selected');
            }
            updateSelectedTags();
            searchWithTags();
            saveSelectedState(); // 保存选中状态
        });
        
        return tag;
    }
    
    // 显示图片
    function displayImages(images) {
        const imageContainer = document.getElementById('image-container');
        if (!imageContainer) {
            console.error('找不到图片容器');
            return;
        }
        
        imageContainer.innerHTML = '';
        images.forEach(imageUrl => {
            createImageElement(imageUrl, imageContainer);
        });
    }
    
    // 创建图片元素
    function createImageElement(imageUrl, container) {
        const imageWrapper = document.createElement('div');
        imageWrapper.className = 'image-wrapper';
        
        const checkboxLabel = document.createElement('label');
        checkboxLabel.className = 'checkbox-container';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'image-checkbox';
        checkbox.checked = selectedImages.has(imageUrl);
        
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                selectedImages.add(imageUrl);
                console.log('已选中图片:', imageUrl);
            } else {
                selectedImages.delete(imageUrl);
                console.log('取消选中图片:', imageUrl);
            }
            console.log('当前选中的图片数量:', selectedImages.size);
        });
        
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = 'Generated image';
        img.className = 'generated-image';
        
        // 添加图片点击事件
        img.addEventListener('click', function(e) {
            e.stopPropagation(); // 阻止事件冒泡
            if (!e.target.closest('.checkbox-container')) { // 确保不是点击复选框
                lightbox.style.display = "block";
                lightboxImg.src = imageUrl;
            }
        });
        
        checkboxLabel.appendChild(checkbox);
        imageWrapper.appendChild(checkboxLabel);
        imageWrapper.appendChild(img);
        container.appendChild(imageWrapper);
    }
    
    // 更新已选标签
    function updateSelectedTags() {
        const selectedTagsDiv = document.getElementById('selected-tags');
        if (!selectedTagsDiv) return;
        
        selectedTagsDiv.innerHTML = '';
        selectedTags.forEach(tag => {
            selectedTagsDiv.appendChild(createClickableTag(tag, 'selected'));
        });
    }
    
    // 使用标签搜索
    async function searchWithTags() {
        if (selectedTags.size === 0) return;
        
        const loadingDiv = document.getElementById('loading');
        try {
            loadingDiv.style.display = 'block';
            
            const tagsText = Array.from(selectedTags).join(' ');
            const response = await fetch('/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    text: tagsText,
                    isTagSearch: true
                })
            });
            
            const data = await response.json();
            if (data.images) {
                // 保存标签搜索结果
                saveSearchResults(data, tagsText);
                displayImages(data.images);
            }
        } catch (error) {
            console.error('标签搜索出错:', error);
        } finally {
            loadingDiv.style.display = 'none';
        }
    }

    // 首先检查所有必需的DOM元素
    const loadingDiv = document.getElementById('loading');
    const imageContainer = document.getElementById('image-container');
    const keywordsDiv = document.getElementById('keywords');
    const sentimentDiv = document.getElementById('sentiment');
    const selectedTagsDiv = document.getElementById('selected-tags');
    
    // 检查必需的元素是否存在
    if (!form || !imageContainer) {
        console.error('找不到必需的DOM元素');
        return;
    }

    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const close = document.querySelector('.close');
    const favorites = new Set();      // 存储收藏的图片

    // 关闭大图
    close.onclick = function() {
        lightbox.style.display = "none";
    }

    // 点击图片外部区域也关闭 lightbox
    lightbox.onclick = function(e) {
        if (e.target === lightbox) {
            lightbox.style.display = "none";
        }
    }

    // 情绪颜色映射
    const emotionColors = {
        admiration: '#9370DB',  // 紫色
        amusement: '#FFB6C1',   // 粉色
        anger: '#FF0000',       // 红色
        annoyance: '#FF6347',   // 橙红
        approval: '#32CD32',    // 绿色
        caring: '#FF69B4',      // 粉红
        confusion: '#DEB887',   // 褐色
        curiosity: '#87CEEB',   // 天蓝
        desire: '#FF1493',      // 深粉
        disappointment: '#778899',// 灰蓝
        disapproval: '#B22222', // 深红
        disgust: '#8B0000',     // 暗红
        embarrassment: '#DB7093',// 粉紫
        excitement: '#FF4500',  // 橙红
        fear: '#800000',       // 褐色
        gratitude: '#98FB98',  // 浅绿
        grief: '#4B0082',      // 靛蓝
        joy: '#FFD700',        // 金色
        love: '#FF69B4',       // 粉红
        nervousness: '#9932CC', // 紫色
        optimism: '#87CEEB',   // 天蓝
        pride: '#FF8C00',      // 深橙
        realization: '#4169E1', // 皇家蓝
        relief: '#B8860B',     // 暗金
        remorse: '#696969',    // 深灰
        sadness: '#4682B4',    // 钢青
        surprise: '#FF7F50',   // 珊瑚
        neutral: '#808080'     // 灰色
    };

    // 处理已选标签的移除
    selectedTagsDiv.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-tag')) {
            const tagText = e.target.parentElement.textContent.slice(0, -2); // 移除 '×' 符号
            selectedTags.delete(tagText);
            updateSelectedTags();
            searchWithTags();
        }
    });

    // 修改加载收藏夹的函数
    function loadFavorites() {
        const savedFavorites = localStorage.getItem('favorites');
        if (savedFavorites) {
            const favoritesArray = JSON.parse(savedFavorites);
            favorites.clear();
            favoritesArray.forEach(url => favorites.add(url));
            console.log('从 localStorage 加载了收藏夹，图片数量:', favorites.size); // 调试日志
            updateFavorites();
        }
    }

    // 页面加载时立即加载收藏夹
    loadFavorites();
});

// 在进入收藏夹页面时设置标记
document.querySelector('.favorites-btn')?.addEventListener('click', function() {
    sessionStorage.setItem('fromFavorites', 'true');
}); 