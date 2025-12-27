/**
 * 健康日志模块
 * 包含：饮食记录、便便健康、遛狗记录
 */

class HealthLogModule {
    constructor() {
        this.supabase = getSupabaseClient();
        this.dietChart = null;
        this.walkChart = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDietRecords();
        this.loadPoopRecords();
        this.loadWalkRecords();
        this.loadOtherRecords();
        this.initCharts();
    }

    setupEventListeners() {
        // 标签页切换
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.closest('#health-log')) {
                btn.addEventListener('click', (e) => {
                    const tabName = e.target.dataset.tab;
                    this.switchTab(tabName);
                });
            }
        });

        // 饮食记录表单
        const dietForm = document.getElementById('diet-form');
        if (dietForm) {
            dietForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addDietRecord();
            });
        }

        // 便便健康表单
        const poopForm = document.getElementById('poop-form');
        if (poopForm) {
            poopForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addPoopRecord();
            });
        }

        // 评分滑块
        const scoreSlider = document.getElementById('poop-score');
        if (scoreSlider) {
            scoreSlider.addEventListener('input', (e) => {
                const value = e.target.value;
                document.getElementById('score-value').textContent = value;
                const indicator = document.getElementById('score-indicator');
                indicator.className = `score-indicator score-${value}`;
            });
        }

        // 遛狗记录表单
        const walkForm = document.getElementById('walk-form');
        if (walkForm) {
            walkForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addWalkRecord();
            });
        }

        // 其他记录表单
        const otherForm = document.getElementById('other-form');
        if (otherForm) {
            otherForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addOtherRecord();
            });
        }
    }

    switchTab(tabName) {
        // 切换标签页
        document.querySelectorAll('#health-log .tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        document.querySelectorAll('#health-log .tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });
    }

    // 饮食记录相关
    async addDietRecord() {
        const foodType = document.getElementById('food-type').value;
        const amount = parseFloat(document.getElementById('food-amount').value);
        const feedingTime = document.getElementById('feeding-time').value;

        if (!foodType || !amount || !feedingTime) {
            showNotification('请填写所有必填项', 'error');
            return;
        }

        const record = {
            id: generateId(),
            food_type: foodType,
            amount: amount,
            feeding_time: feedingTime,
            created_at: new Date().toISOString()
        };

        // 保存到Supabase（如果已配置）
        if (this.supabase) {
            try {
                const { error } = await this.supabase
                    .from('diet_records')
                    .insert([record]);
                if (error) throw error;
            } catch (error) {
                console.error('保存失败:', error);
                // 降级到本地存储
                this.saveDietRecordLocal(record);
            }
        } else {
            this.saveDietRecordLocal(record);
        }

        showNotification('饮食记录已保存', 'success');
        document.getElementById('diet-form').reset();
        this.loadDietRecords();
        this.updateDietChart();
    }

    saveDietRecordLocal(record) {
        const records = storage.get('diet_records', []);
        records.push(record);
        // 按时间倒序排列（最新的在前）
        records.sort((a, b) => new Date(b.feeding_time) - new Date(a.feeding_time));
        storage.set('diet_records', records);
    }

    async loadDietRecords() {
        let records = [];

        if (this.supabase) {
            try {
                const { data, error } = await this.supabase
                    .from('diet_records')
                    .select('*')
                    .order('feeding_time', { ascending: false })
                    .limit(50);
                if (error) {
                    // 如果是表不存在错误，静默降级到LocalStorage
                    if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
                        records = storage.get('diet_records', []);
                    } else {
                        throw error;
                    }
                } else {
                    records = data || [];
                }
            } catch (error) {
                // 静默降级到LocalStorage
                records = storage.get('diet_records', []);
            }
        } else {
            records = storage.get('diet_records', []);
        }

        // 确保倒序排列（最新的在前）
        records.sort((a, b) => new Date(b.feeding_time) - new Date(a.feeding_time));
        this.renderDietRecords(records);
    }

    renderDietRecords(records) {
        const container = document.getElementById('diet-records');
        if (!container) return;

        if (records.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">暂无记录</p>';
            return;
        }

        container.innerHTML = records.map(record => `
            <div class="record-card">
                <div class="record-info">
                    <div class="record-title">${record.food_type}</div>
                    <div class="record-meta">
                        ${formatDateTime(record.feeding_time)} · ${record.amount}克
                    </div>
                </div>
                <div class="record-actions">
                    <button onclick="healthLogModule.deleteDietRecord('${record.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    async deleteDietRecord(id) {
        if (this.supabase) {
            try {
                const { error } = await this.supabase
                    .from('diet_records')
                    .delete()
                    .eq('id', id);
                if (error) throw error;
            } catch (error) {
                console.error('删除失败:', error);
            }
        }

        const records = storage.get('diet_records', []);
        const filtered = records.filter(r => r.id !== id);
        storage.set('diet_records', filtered);

        this.loadDietRecords();
        this.updateDietChart();
    }

    initCharts() {
        // 初始化饮食图表
        const dietCtx = document.getElementById('diet-chart');
        if (dietCtx) {
            this.dietChart = new Chart(dietCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: '每日热量摄入',
                        data: [],
                        borderColor: '#4A90E2',
                        backgroundColor: 'rgba(74, 144, 226, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        // 初始化遛狗图表
        const walkCtx = document.getElementById('walk-chart');
        if (walkCtx) {
            this.walkChart = new Chart(walkCtx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: '周度运动距离（公里）',
                        data: [],
                        backgroundColor: '#FFB6C1'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        this.updateDietChart();
        this.updateWalkChart();
    }

    updateDietChart() {
        if (!this.dietChart) return;

        const records = storage.get('diet_records', []);
        const dailyData = {};

        records.forEach(record => {
            const date = formatDate(record.feeding_time);
            if (!dailyData[date]) {
                dailyData[date] = 0;
            }
            // 简单估算：每克食物约1卡路里（实际应根据食物类型计算）
            dailyData[date] += record.amount;
        });

        const dates = Object.keys(dailyData).sort().slice(-7);
        const calories = dates.map(date => dailyData[date]);

        this.dietChart.data.labels = dates;
        this.dietChart.data.datasets[0].data = calories;
        this.dietChart.update();
    }

    // 便便健康相关
    async addPoopRecord() {
        const poopTime = document.getElementById('poop-time').value;
        const score = parseInt(document.getElementById('poop-score').value);
        const color = document.getElementById('poop-color').value;
        const notes = document.getElementById('poop-notes').value;

        if (!poopTime) {
            showNotification('请填写排便时间', 'error');
            return;
        }

        const record = {
            id: generateId(),
            poop_time: poopTime,
            score: score,
            color: color,
            notes: notes,
            created_at: new Date().toISOString()
        };

        if (this.supabase) {
            try {
                const { error } = await this.supabase
                    .from('poop_records')
                    .insert([record]);
                if (error) throw error;
            } catch (error) {
                console.error('保存失败:', error);
                this.savePoopRecordLocal(record);
            }
        } else {
            this.savePoopRecordLocal(record);
        }

        showNotification('便便健康记录已保存', 'success');
        document.getElementById('poop-form').reset();
        document.getElementById('score-value').textContent = '3';
        document.getElementById('score-indicator').className = 'score-indicator score-3';
        this.loadPoopRecords();
        this.checkPoopAlerts();
    }

    savePoopRecordLocal(record) {
        const records = storage.get('poop_records', []);
        records.push(record);
        storage.set('poop_records', records);
    }

    async loadPoopRecords() {
        let records = [];

        if (this.supabase) {
            try {
                const { data, error } = await this.supabase
                    .from('poop_records')
                    .select('*')
                    .order('poop_time', { ascending: false })
                    .limit(50);
                if (error) {
                    if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
                        records = storage.get('poop_records', []);
                    } else {
                        throw error;
                    }
                } else {
                    records = data || [];
                }
            } catch (error) {
                records = storage.get('poop_records', []);
            }
        } else {
            records = storage.get('poop_records', []);
        }

        // 确保倒序排列（最新的在前）
        records.sort((a, b) => new Date(b.poop_time) - new Date(a.poop_time));
        this.renderPoopRecords(records);
    }

    renderPoopRecords(records) {
        const container = document.getElementById('poop-records');
        if (!container) return;

        if (records.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">暂无记录</p>';
            return;
        }

        container.innerHTML = records.map(record => {
            const isLowScore = record.score <= 2;
            return `
                <div class="record-card ${isLowScore ? 'low-score' : ''}" style="${isLowScore ? 'border-left: 4px solid var(--danger-color);' : ''}">
                    <div class="record-info">
                        <div class="record-title">
                            评分: ${record.score}/5
                            <span class="score-indicator score-${record.score}" style="display: inline-block; margin-left: 0.5rem;"></span>
                        </div>
                        <div class="record-meta">
                            ${formatDateTime(record.poop_time)}
                            ${record.notes ? ` · ${record.notes}` : ''}
                        </div>
                    </div>
                    <div class="record-actions">
                        <button onclick="healthLogModule.deletePoopRecord('${record.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    async deletePoopRecord(id) {
        if (this.supabase) {
            try {
                const { error } = await this.supabase
                    .from('poop_records')
                    .delete()
                    .eq('id', id);
                if (error) throw error;
            } catch (error) {
                console.error('删除失败:', error);
            }
        }

        const records = storage.get('poop_records', []);
        const filtered = records.filter(r => r.id !== id);
        storage.set('poop_records', filtered);

        this.loadPoopRecords();
    }

    checkPoopAlerts() {
        const records = storage.get('poop_records', []);
        const recentRecords = records
            .sort((a, b) => new Date(b.poop_time) - new Date(a.poop_time))
            .slice(0, 2);

        if (recentRecords.length === 2 && recentRecords.every(r => r.score <= 2)) {
            showNotification('⚠️ 连续2天便便健康评分较低，建议关注', 'error');
        }
    }

    // 遛狗记录相关
    async addWalkRecord() {
        const walkStart = document.getElementById('walk-start').value;
        const walkEnd = document.getElementById('walk-end').value;
        const distance = parseFloat(document.getElementById('walk-distance').value);
        const route = document.getElementById('walk-route').value;

        if (!walkStart || !walkEnd) {
            showNotification('请填写开始和结束时间', 'error');
            return;
        }

        if (!distance || distance <= 0) {
            showNotification('请填写距离', 'error');
            return;
        }

        if (!route) {
            showNotification('请填写路线', 'error');
            return;
        }

        const minutes = getTimeDifference(walkStart, walkEnd);
        if (minutes <= 0) {
            showNotification('结束时间必须晚于开始时间', 'error');
            return;
        }

        const record = {
            id: generateId(),
            walk_start: walkStart,
            walk_end: walkEnd,
            distance: distance,
            route: route,
            duration_minutes: minutes,
            created_at: new Date().toISOString()
        };

        if (this.supabase) {
            try {
                const { error } = await this.supabase
                    .from('walk_records')
                    .insert([record]);
                if (error) throw error;
            } catch (error) {
                console.error('保存失败:', error);
                this.saveWalkRecordLocal(record);
            }
        } else {
            this.saveWalkRecordLocal(record);
        }

        showNotification('遛狗记录已保存', 'success');
        document.getElementById('walk-form').reset();
        this.loadWalkRecords();
        this.updateWalkChart();
    }

    saveWalkRecordLocal(record) {
        const records = storage.get('walk_records', []);
        records.push(record);
        storage.set('walk_records', records);
    }

    async loadWalkRecords() {
        let records = [];

        if (this.supabase) {
            try {
                const { data, error } = await this.supabase
                    .from('walk_records')
                    .select('*')
                    .order('walk_start', { ascending: false })
                    .limit(50);
                if (error) {
                    if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
                        records = storage.get('walk_records', []);
                    } else {
                        throw error;
                    }
                } else {
                    records = data || [];
                }
            } catch (error) {
                records = storage.get('walk_records', []);
            }
        } else {
            records = storage.get('walk_records', []);
        }

        // 确保倒序排列（最新的在前）
        records.sort((a, b) => new Date(b.walk_start) - new Date(a.walk_start));
        this.renderWalkRecords(records);
    }

    renderWalkRecords(records) {
        const container = document.getElementById('walk-records');
        if (!container) return;

        if (records.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">暂无记录</p>';
            return;
        }

        container.innerHTML = records.map(record => `
            <div class="record-card">
                <div class="record-info">
                    <div class="record-title">${record.route || '遛狗记录'}</div>
                    <div class="record-meta">
                        ${formatDateTime(record.walk_start)} - ${formatDateTime(record.walk_end)}
                        <br>
                        时长: ${record.duration_minutes}分钟 · 距离: ${record.distance || 0}公里
                    </div>
                </div>
                <div class="record-actions">
                    <button onclick="healthLogModule.deleteWalkRecord('${record.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    async deleteWalkRecord(id) {
        if (this.supabase) {
            try {
                const { error } = await this.supabase
                    .from('walk_records')
                    .delete()
                    .eq('id', id);
                if (error) throw error;
            } catch (error) {
                console.error('删除失败:', error);
            }
        }

        const records = storage.get('walk_records', []);
        const filtered = records.filter(r => r.id !== id);
        storage.set('walk_records', filtered);

        this.loadWalkRecords();
        this.updateWalkChart();
    }

    updateWalkChart() {
        if (!this.walkChart) return;

        const records = storage.get('walk_records', []);
        const weeklyData = {};

        records.forEach(record => {
            const date = new Date(record.walk_start);
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            const weekKey = formatDate(weekStart);

            if (!weeklyData[weekKey]) {
                weeklyData[weekKey] = 0;
            }
            weeklyData[weekKey] += (record.distance || 0);
        });

        const weeks = Object.keys(weeklyData).sort().slice(-4);
        const distances = weeks.map(week => weeklyData[week]);

        this.walkChart.data.labels = weeks;
        this.walkChart.data.datasets[0].label = '周度运动距离（公里）';
        this.walkChart.data.datasets[0].data = distances;
        this.walkChart.update();
    }

    // 其他记录相关
    async addOtherRecord() {
        const type = document.getElementById('other-type').value;
        const time = document.getElementById('other-time').value;
        const notes = document.getElementById('other-notes').value;

        if (!type || !time) {
            showNotification('请填写所有必填项', 'error');
            return;
        }

        const typeLabels = {
            bath: '洗澡',
            deworm: '驱虫',
            vaccine: '疫苗'
        };

        const record = {
            id: generateId(),
            type: type,
            type_label: typeLabels[type] || type,
            time: time,
            notes: notes || '',
            created_at: new Date().toISOString()
        };

        if (this.supabase) {
            try {
                const { error } = await this.supabase
                    .from('other_records')
                    .insert([record]);
                if (error) throw error;
            } catch (error) {
                console.error('保存失败:', error);
                this.saveOtherRecordLocal(record);
            }
        } else {
            this.saveOtherRecordLocal(record);
        }

        showNotification('记录已保存', 'success');
        document.getElementById('other-form').reset();
        this.loadOtherRecords();
    }

    saveOtherRecordLocal(record) {
        const records = storage.get('other_records', []);
        records.push(record);
        storage.set('other_records', records);
    }

    async loadOtherRecords() {
        let records = [];

        if (this.supabase) {
            try {
                const { data, error } = await this.supabase
                    .from('other_records')
                    .select('*')
                    .order('time', { ascending: false })
                    .limit(50);
                if (error) {
                    if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
                        records = storage.get('other_records', []);
                    } else {
                        throw error;
                    }
                } else {
                    records = data || [];
                }
            } catch (error) {
                records = storage.get('other_records', []);
            }
        } else {
            records = storage.get('other_records', []);
        }

        // 确保倒序排列（最新的在前）
        records.sort((a, b) => new Date(b.time) - new Date(a.time));
        this.renderOtherRecords(records);
    }

    renderOtherRecords(records) {
        const container = document.getElementById('other-records');
        if (!container) return;

        if (records.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">暂无记录</p>';
            return;
        }

        const typeIcons = {
            bath: '🛁',
            deworm: '💊',
            vaccine: '💉'
        };

        container.innerHTML = records.map(record => `
            <div class="record-card">
                <div class="record-info">
                    <div class="record-title">
                        ${typeIcons[record.type] || '📝'} ${record.type_label || record.type}
                    </div>
                    <div class="record-meta">
                        ${formatDateTime(record.time)}
                        ${record.notes ? `<br>${record.notes}` : ''}
                    </div>
                </div>
                <div class="record-actions">
                    <button onclick="healthLogModule.deleteOtherRecord('${record.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    async deleteOtherRecord(id) {
        if (this.supabase) {
            try {
                const { error } = await this.supabase
                    .from('other_records')
                    .delete()
                    .eq('id', id);
                if (error) throw error;
            } catch (error) {
                console.error('删除失败:', error);
            }
        }

        const records = storage.get('other_records', []);
        const filtered = records.filter(r => r.id !== id);
        storage.set('other_records', filtered);

        this.loadOtherRecords();
    }
}

// 全局实例（将在app.js中初始化）
// let healthLogModule = null;
