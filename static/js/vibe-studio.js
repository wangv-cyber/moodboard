let selectedImages = new Set(); // 用于存储选中的图片

document.addEventListener('DOMContentLoaded', function() {
    const favoritesContainer = document.getElementById('favorites-container');
    
    function createImageElement(imageUrl) {
        const imageWrapper = document.createElement('div');
        imageWrapper.className = 'image-wrapper';

        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = 'Generated image';
        img.className = 'generated-image';

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-favorite';
        removeBtn.onclick = () => {
            removeImage(imageWrapper, imageUrl);
        };

        imageWrapper.appendChild(img);
        imageWrapper.appendChild(removeBtn);
        favoritesContainer.appendChild(imageWrapper);

        // 添加点击放大功能
        img.addEventListener('click', function(e) {
            if (!e.target.closest('.remove-favorite')) {
                const lightbox = document.getElementById('lightbox');
                const lightboxImg = document.getElementById('lightbox-img');
                lightbox.style.display = "block";
                lightboxImg.src = imageUrl;
            }
        });
    }
    
    function loadFavorites() {
        const savedFavorites = localStorage.getItem('favorites');
        if (savedFavorites) {
            const favorites = JSON.parse(savedFavorites);
            favoritesContainer.innerHTML = '';
            favorites.forEach(imageUrl => {
                if (imageUrl) {
                    createImageElement(imageUrl);
                }
            });
        }
    }
    
    function removeImage(imageWrapper, imageUrl) {
        imageWrapper.remove();
        const savedFavorites = JSON.parse(localStorage.getItem('favorites')) || [];
        const updatedFavorites = savedFavorites.filter(url => url !== imageUrl);
        localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
    }
    
    // 初始化
    loadFavorites();
    
    // 添加 lightbox 关闭功能
    const lightbox = document.getElementById('lightbox');
    const close = document.querySelector('.close');
    
    close.onclick = function() {
        lightbox.style.display = "none";
    }
    
    lightbox.onclick = function(e) {
        if (e.target === lightbox) {
            lightbox.style.display = "none";
        }
    }
});

// 保存收藏夹
document.getElementById('save-favorites').addEventListener('click', function() {
    const favorites = Array.from(selectedImages);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    console.log('已保存到收藏夹:', favorites);
});

// 处理返回按钮点击
function handleBackClick(event) {
    console.log('点击返回按钮');
    sessionStorage.setItem('fromFavorites', 'true'); // 设置标记
}