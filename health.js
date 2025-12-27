let currentPetId = 1; // 固定为考拉，ID为1
let dietChart = null;
let poopChart = null;

// 初始化时加载数据
async function initHealthData() {
    // 尝试获取宠物ID，如果没有则使用默认值1
    try {
        const pets = await healthAPI.getPets();
        if (pets && pets.length > 0) {
            currentPetId = pets[0].id;
        }
    } catch (error) {
        console.log('使用默认宠物ID');
    }
    loadHealthData();
}

// 加载健康数据
async function loadHealthData() {
    if (!currentPetId) return;
    
    await Promise.all([
        loadDietRecords(),
        loadPoopRecords(),
        loadWalkRecords()
    ]);
}

// 切换健康日志标签
function switchHealthTab(tab) {
    const tabs = ['diet', 'poop', 'walk', 'stats'];
    tabs.forEach(t => {
        const tabElement = document.getElementById(`${t}Tab`);
        if (tabElement) {
            tabElement.classList.toggle('active', t === tab);
        }
    });
    
    // 更新按钮状态
    document.querySelectorAll('.health-tabs .tab-btn').forEach((btn, index) => {
        btn.classList.toggle('active', tabs[index] === tab);
    });
    
    if (tab === 'stats' && currentPetId) {
        loadStats();
    }
}

// 显示饮食表单
function showDietForm() {
    const form = document.getElementById('dietForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
    if (form.style.display === 'block') {
        document.getElementById('dietTime').value = new Date().toISOString().slice(0, 16);
    }
}

// 提交饮食记录
async function submitDietRecord() {
    if (!currentPetId) {
        alert('请先登录');
        return;
    }
    
    const record = {
        pet_id: parseInt(currentPetId),
        food_type: document.getElementById('dietFoodType').value,
        amount: parseFloat(document.getElementById('dietAmount').value),
        calories: parseFloat(document.getElementById('dietCalories').value),
        feed_time: document.getElementById('dietTime').value,
        notes: document.getElementById('dietNotes').value,
    };
    
    try {
        await healthAPI.addDietRecord(record);
        document.getElementById('dietForm').style.display = 'none';
        document.getElementById('dietForm').reset();
        loadDietRecords();
    } catch (error) {
        alert('添加失败: ' + error.message);
    }
}

// 加载饮食记录
async function loadDietRecords() {
    if (!currentPetId) return;
    
    try {
        const records = await healthAPI.getDietRecords(currentPetId);
        const container = document.getElementById('dietRecords');
        if (records.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-light);">暂无记录</p>';
            return;
        }
        container.innerHTML = records.map(record => `
            <div class="record-item">
                <div class="record-item-header">
                    <span class="record-item-title">${record.food_type}</span>
                    <span class="record-item-time">${new Date(record.feed_time).toLocaleString()}</span>
                </div>
                <div class="record-item-content">
                    <p>分量: ${record.amount}克</p>
                    <p>热量: ${record.calories || '未记录'}卡路里</p>
                    ${record.notes ? `<p>备注: ${record.notes}</p>` : ''}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('加载饮食记录失败:', error);
    }
}

// 显示便便表单
function showPoopForm() {
    const form = document.getElementById('poopForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
    if (form.style.display === 'block') {
        document.getElementById('poopTime').value = new Date().toISOString().slice(0, 16);
    }
}

// 更新评分显示
function updateScoreDisplay(value) {
    document.getElementById('scoreDisplay').textContent = value;
}

// 提交便便记录
async function submitPoopRecord() {
    if (!currentPetId) {
        alert('请先登录');
        return;
    }
    
    const record = {
        pet_id: parseInt(currentPetId),
        poop_time: document.getElementById('poopTime').value,
        health_score: parseInt(document.getElementById('poopScore').value),
        color: document.getElementById('poopColor').value,
        notes: document.getElementById('poopNotes').value,
    };
    
    try {
        await healthAPI.addPoopRecord(record);
        document.getElementById('poopForm').style.display = 'none';
        document.getElementById('poopForm').reset();
        loadPoopRecords();
    } catch (error) {
        alert('添加失败: ' + error.message);
    }
}

// 加载便便记录
async function loadPoopRecords() {
    if (!currentPetId) return;
    
    try {
        const records = await healthAPI.getPoopRecords(currentPetId);
        const container = document.getElementById('poopRecords');
        if (records.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-light);">暂无记录</p>';
            return;
        }
        container.innerHTML = records.map(record => `
            <div class="record-item ${record.is_abnormal ? 'abnormal' : ''}">
                <div class="record-item-header">
                    <span class="record-item-title">便便记录</span>
                    <span class="record-item-time">${new Date(record.poop_time).toLocaleString()}</span>
                </div>
                <div class="record-item-content">
                    <p>健康评分: <span class="health-score score-${record.health_score}">${record.health_score}/5</span></p>
                    ${record.color ? `<p>颜色: ${record.color}</p>` : ''}
                    ${record.notes ? `<p>备注: ${record.notes}</p>` : ''}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('加载便便记录失败:', error);
    }
}

// 显示遛狗表单
function showWalkForm() {
    const form = document.getElementById('walkForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
    if (form.style.display === 'block') {
        const now = new Date();
        document.getElementById('walkStartTime').value = now.toISOString().slice(0, 16);
        const endTime = new Date(now.getTime() + 30 * 60000);
        document.getElementById('walkEndTime').value = endTime.toISOString().slice(0, 16);
    }
}

// 提交遛狗记录（只保留时长、距离、路线）
async function submitWalkRecord() {
    if (!currentPetId) {
        alert('请先登录');
        return;
    }
    
    const startTime = document.getElementById('walkStartTime').value;
    const endTime = document.getElementById('walkEndTime').value;
    const distance = document.getElementById('walkDistance').value;
    const route = document.getElementById('walkRoute').value;
    
    if (!distance || !route) {
        alert('请填写距离和路线信息');
        return;
    }
    
    const record = {
        pet_id: parseInt(currentPetId),
        start_time: startTime,
        end_time: endTime,
        distance: parseFloat(distance),
        route_info: route,
        calories_estimated: null, // 不再使用
        notes: null, // 不再使用
    };
    
    try {
        await healthAPI.addWalkRecord(record);
        document.getElementById('walkForm').style.display = 'none';
        document.getElementById('walkForm').reset();
        loadWalkRecords();
    } catch (error) {
        alert('添加失败: ' + error.message);
    }
}

// 加载遛狗记录
async function loadWalkRecords() {
    if (!currentPetId) return;
    
    try {
        const records = await healthAPI.getWalkRecords(currentPetId);
        const container = document.getElementById('walkRecords');
        if (records.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-light);">暂无记录</p>';
            return;
        }
        container.innerHTML = records.map(record => {
            const duration = new Date(record.end_time) - new Date(record.start_time);
            const minutes = Math.floor(duration / 60000);
            return `
                <div class="record-item">
                    <div class="record-item-header">
                        <span class="record-item-title">遛狗记录</span>
                        <span class="record-item-time">${new Date(record.start_time).toLocaleString()}</span>
                    </div>
                    <div class="record-item-content">
                        <p>时长: ${minutes}分钟</p>
                        ${record.distance ? `<p>距离: ${record.distance}公里</p>` : ''}
                        ${record.route_info ? `<p>路线: ${record.route_info}</p>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('加载遛狗记录失败:', error);
    }
}

// 加载统计数据
async function loadStats() {
    if (!currentPetId) return;
    
    const period = document.getElementById('statsPeriod').value;
    
    try {
        const stats = await healthAPI.getStats(currentPetId, period);
        renderCharts(stats);
    } catch (error) {
        console.error('加载统计数据失败:', error);
    }
}

// 渲染图表
function renderCharts(stats) {
    // 饮食图表
    const dietCtx = document.getElementById('dietChart');
    if (dietChart) dietChart.destroy();
    dietChart = new Chart(dietCtx, {
        type: 'line',
        data: {
            labels: stats.diet.map(d => d.date),
            datasets: [{
                label: '热量摄入',
                data: stats.diet.map(d => parseFloat(d.total_calories || 0)),
                borderColor: '#FFB6C1',
                backgroundColor: 'rgba(255, 182, 193, 0.1)',
                tension: 0.4,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
    
    // 便便健康图表
    const poopCtx = document.getElementById('poopChart');
    if (poopChart) poopChart.destroy();
    poopChart = new Chart(poopCtx, {
        type: 'bar',
        data: {
            labels: stats.poop.map(d => d.date),
            datasets: [{
                label: '健康评分',
                data: stats.poop.map(d => parseFloat(d.avg_score || 0)),
                backgroundColor: stats.poop.map(d => {
                    const score = parseFloat(d.avg_score || 0);
                    if (score >= 4) return '#D0F0C0';
                    if (score >= 3) return '#FFF8DC';
                    return '#FFB6C1';
                }),
                borderRadius: 10,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 5
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
    
    // 移除运动图表，因为遛狗记录已简化
}
