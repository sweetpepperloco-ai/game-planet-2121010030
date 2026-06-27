/* ============================================
   我的游戏星球 - 交互逻辑
   ============================================ */

// ============ 全局变量 ============
let gamesData = [];
let currentCategory = 'all';
let currentSearch = '';
let radarChart = null;

// ============ 初始化 ============
document.addEventListener('DOMContentLoaded', () => {
    loadGameData();
    initEventListeners();
    initScrollEffects();
});

// ============ 数据加载 ============
async function loadGameData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) throw new Error('数据加载失败');
        gamesData = await response.json();
        renderGames(gamesData);
        updateStats();
        initRadarChart();
    } catch (error) {
        console.error('加载数据出错:', error);
        document.getElementById('gamesGrid').innerHTML =
            '<p style="text-align:center;color:#546E7A;grid-column:1/-1;">数据加载失败，请检查网络连接</p>';
    }
}

// ============ 事件监听 ============
function initEventListeners() {
    // 分类筛选
    document.getElementById('filterBar').addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-btn')) {
            const category = e.target.dataset.category;
            currentCategory = category;

            // 更新按钮状态
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');

            filterAndRender();
        }
    });

    // 搜索输入
    const searchInput = document.getElementById('searchInput');
    let searchTimer = null;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            currentSearch = e.target.value.trim().toLowerCase();
            filterAndRender();
        }, 200);
    });

    // 清除搜索
    document.getElementById('clearSearchBtn').addEventListener('click', () => {
        currentSearch = '';
        document.getElementById('searchInput').value = '';
        filterAndRender();
    });

    // 弹窗关闭
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModal();
    });

    // ESC关闭弹窗
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}

// ============ 滚动效果 ============
function initScrollEffects() {
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// ============ 筛选与渲染 ============
function filterAndRender() {
    let filtered = [...gamesData];

    // 分类筛选
    if (currentCategory !== 'all') {
        filtered = filtered.filter(game => game.category === currentCategory);
    }

    // 关键词搜索
    if (currentSearch) {
        filtered = filtered.filter(game => {
            const searchFields = [
                game.name,
                game.nameEn.toLowerCase(),
                game.categoryName,
                game.subCategory,
                game.description,
                game.review,
                ...game.tags
            ].join(' ').toLowerCase();
            return searchFields.includes(currentSearch);
        });

        // 显示搜索提示
        const searchInfo = document.getElementById('searchInfo');
        const searchInfoText = document.getElementById('searchInfoText');
        searchInfo.style.display = 'flex';
        searchInfoText.textContent = `搜索 "${document.getElementById('searchInput').value}" 找到 ${filtered.length} 个结果`;
    } else {
        document.getElementById('searchInfo').style.display = 'none';
    }

    renderGames(filtered);
}

// ============ 渲染游戏卡片 ============
function renderGames(games) {
    const grid = document.getElementById('gamesGrid');
    const emptyState = document.getElementById('emptyState');

    if (games.length === 0) {
        grid.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    grid.innerHTML = games.map((game, index) => `
        <div class="game-card" onclick="openModal(${game.id})" style="animation-delay: ${index * 0.05}s">
            <div class="game-card-image-wrapper">
                <img class="game-card-image" src="${game.image}" alt="${game.name}" loading="lazy">
                <div class="game-card-overlay">
                    <span>查看详情</span>
                </div>
            </div>
            <div class="game-card-body">
                <h3 class="game-card-name">${game.name}</h3>
                <p class="game-card-name-en">${game.nameEn}</p>
                <span class="game-card-category">${game.subCategory}</span>
                <div class="game-card-footer">
                    <div class="game-card-rating">
                        <span class="stars">${getStarDisplay(game.rating)}</span>
                        <span class="score">${game.rating}</span>
                    </div>
                    <span class="game-card-playtime">${game.playTime}h</span>
                </div>
            </div>
        </div>
    `).join('');
}

// ============ 星星显示 ============
function getStarDisplay(rating) {
    const fullStars = Math.floor(rating / 2);
    const halfStar = (rating % 2) >= 1 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;
    return '★'.repeat(fullStars) + (halfStar ? '☆' : '') + '☆'.repeat(emptyStars);
}

// ============ 弹窗 ============
function openModal(gameId) {
    const game = gamesData.find(g => g.id === gameId);
    if (!game) return;

    // 填充弹窗内容
    document.getElementById('modalImage').src = game.image;
    document.getElementById('modalImage').alt = game.name;
    document.getElementById('modalTitle').textContent = game.name;
    document.getElementById('modalNameEn').textContent = game.nameEn;
    document.getElementById('modalCategory').textContent = game.categoryName;
    document.getElementById('modalSubCategory').textContent = game.subCategory;
    document.getElementById('modalStars').textContent = getStarDisplay(game.rating);
    document.getElementById('modalRating').textContent = game.rating + ' / 10';
    document.getElementById('modalPlatform').textContent = game.platform;
    document.getElementById('modalPlayTime').textContent = game.playTime;
    document.getElementById('modalDescription').textContent = game.description;
    document.getElementById('modalReview').textContent = game.review;

    // 标签
    const tagsContainer = document.getElementById('modalTags');
    tagsContainer.innerHTML = game.tags.map(tag =>
        `<span class="modal-tag">${tag}</span>`
    ).join('');

    // 显示弹窗
    const overlay = document.getElementById('modalOverlay');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const overlay = document.getElementById('modalOverlay');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
}

// ============ 统计数据 ============
function updateStats() {
    const totalGames = gamesData.length;
    const totalHours = gamesData.reduce((sum, g) => sum + g.playTime, 0);
    const avgRating = (gamesData.reduce((sum, g) => sum + g.rating, 0) / totalGames).toFixed(1);

    // 找出游戏最多的分类
    const categoryCount = {};
    gamesData.forEach(g => {
        categoryCount[g.categoryName] = (categoryCount[g.categoryName] || 0) + 1;
    });
    const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0][0];

    document.getElementById('totalGames').textContent = totalGames;
    document.getElementById('totalHours').textContent = totalHours;
    document.getElementById('avgRating').textContent = avgRating;
    document.getElementById('topCategory').textContent = topCategory;
    document.getElementById('gameCount').textContent = totalGames;
    document.getElementById('categoryCount').textContent = Object.keys(categoryCount).length;
}

// ============ 雷达图 ============
function initRadarChart() {
    const ctx = document.getElementById('radarChart').getContext('2d');

    const data = {
        labels: ['探索冒险', '操作挑战', '合作社交', '竞技对抗', '建造创造', '剧情叙事'],
        datasets: [{
            label: '个人偏好',
            data: [9, 8, 9, 7, 7, 9],
            backgroundColor: 'rgba(79, 195, 247, 0.2)',
            borderColor: 'rgba(79, 195, 247, 0.8)',
            borderWidth: 2,
            pointBackgroundColor: '#4FC3F7',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointHoverBackgroundColor: '#4FC3F7',
            pointHoverBorderColor: '#fff'
        }]
    };

    const config = {
        type: 'radar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 10,
                    min: 0,
                    ticks: {
                        stepSize: 2,
                        font: {
                            size: 11,
                            family: "'Poppins', sans-serif"
                        },
                        color: '#90A4AE',
                        backdropColor: 'transparent'
                    },
                    pointLabels: {
                        font: {
                            size: 13,
                            family: "'Noto Sans SC', sans-serif",
                            weight: '500'
                        },
                        color: '#546E7A'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.06)'
                    },
                    angleLines: {
                        color: 'rgba(0, 0, 0, 0.06)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(44, 62, 80, 0.9)',
                    titleFont: {
                        family: "'Noto Sans SC', sans-serif",
                        size: 13
                    },
                    bodyFont: {
                        family: "'Poppins', sans-serif",
                        size: 12
                    },
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: function (context) {
                            return `偏好度: ${context.raw} / 10`;
                        }
                    }
                }
            }
        }
    };

    radarChart = new Chart(ctx, config);
}
