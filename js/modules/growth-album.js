/**
 * 成长相册模块
 * 包含：时间轴相册、智能标签、成长指标
 */

class GrowthAlbumModule {
    constructor() {
        this.supabase = getSupabaseClient();
        this.photos = [];
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadPhotos();
    }

    setupEventListeners() {
        // 上传照片按钮
        const uploadBtn = document.getElementById('upload-photo-btn');
        const uploadInput = document.getElementById('photo-upload');
        
        if (uploadBtn && uploadInput) {
            uploadBtn.addEventListener('click', () => {
                uploadInput.click();
            });

            uploadInput.addEventListener('change', (e) => {
                this.handlePhotoUpload(e.target.files);
            });
        }

        // 筛选按钮
        document.querySelectorAll('.filter-btn').forEach(btn => {
            if (btn.closest('#growth-album')) {
                btn.addEventListener('click', (e) => {
                    const filter = e.target.dataset.filter;
                    this.setFilter(filter);
                });
            }
        });
    }

    async handlePhotoUpload(files) {
        if (!files || files.length === 0) return;

        for (let file of files) {
            if (!file.type.startsWith('image/')) {
                showNotification(`${file.name} 不是有效的图片文件`, 'error');
                continue;
            }

            try {
                // 读取图片
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const photoData = {
                        id: generateId(),
                        file_name: file.name,
                        data_url: e.target.result,
                        upload_time: new Date().toISOString(),
                        photo_time: await this.extractPhotoTime(file),
                        tags: [],
                        weight: null,
                        length: null,
                        created_at: new Date().toISOString()
                    };

                    // 尝试AI识别场景
                    photoData.tags = await this.autoTagPhoto(photoData.data_url);

                    // 保存照片
                    await this.savePhoto(photoData);
                    this.photos.push(photoData);
                    this.renderPhotos();
                    showNotification('照片上传成功', 'success');
                };
                reader.readAsDataURL(file);
            } catch (error) {
                console.error('上传失败:', error);
                showNotification('照片上传失败', 'error');
            }
        }
    }

    async extractPhotoTime(file) {
        // 尝试从EXIF数据提取拍摄时间
        // 简化版本：使用文件修改时间或当前时间
        return new Date(file.lastModified || Date.now()).toISOString();
    }

    async autoTagPhoto(dataUrl) {
        // AI自动识别场景（简化版本）
        // 实际应用中应调用AI服务
        const tags = [];
        
        // 模拟AI识别（实际应调用OpenAI API或其他AI服务）
        // 这里使用简单的关键词匹配作为示例
        const image = new Image();
        image.src = dataUrl;
        
        // 返回一些默认标签
        tags.push('新照片');
        
        // 可以根据时间判断
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 12) {
            tags.push('早晨');
        } else if (hour >= 12 && hour < 18) {
            tags.push('下午');
        } else {
            tags.push('晚上');
        }

        return tags;
    }

    async savePhoto(photoData) {
        if (this.supabase) {
            try {
                // 如果使用Supabase Storage，需要先上传文件
                // 这里简化处理，将base64数据保存到数据库
                const { error } = await this.supabase
                    .from('photos')
                    .insert([{
                        ...photoData,
                        // 注意：实际应用中，大图片应上传到Storage，这里只保存元数据
                    }]);
                if (error) throw error;
            } catch (error) {
                console.error('保存失败:', error);
                this.savePhotoLocal(photoData);
            }
        } else {
            this.savePhotoLocal(photoData);
        }
    }

    savePhotoLocal(photoData) {
        const photos = storage.get('photos', []);
        photos.push(photoData);
        // 按时间倒序排列（最新的在前）
        photos.sort((a, b) => new Date(b.photo_time || b.upload_time) - new Date(a.photo_time || a.upload_time));
        storage.set('photos', photos);
    }

    async loadPhotos() {
        let photos = [];

        if (this.supabase) {
            try {
                const { data, error } = await this.supabase
                    .from('photos')
                    .select('*')
                    .order('photo_time', { ascending: false });
                if (error) {
                    if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
                        photos = storage.get('photos', []);
                    } else {
                        throw error;
                    }
                } else {
                    photos = data || [];
                }
            } catch (error) {
                photos = storage.get('photos', []);
            }
        } else {
            photos = storage.get('photos', []);
        }

        // 确保倒序排列（最新的在前）
        photos.sort((a, b) => new Date(b.photo_time || b.upload_time) - new Date(a.photo_time || a.upload_time));
        this.photos = photos;
        this.renderPhotos();
    }

    renderPhotos() {
        const container = document.getElementById('album-timeline');
        if (!container) return;

        let filteredPhotos = this.photos;

        // 按月份筛选
        if (this.currentFilter === 'month') {
            const grouped = this.groupPhotosByMonth(filteredPhotos);
            container.innerHTML = this.renderMonthlyView(grouped);
            return;
        }

        // 全部显示
        if (filteredPhotos.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); grid-column: 1/-1;">暂无照片</p>';
            return;
        }

        container.innerHTML = filteredPhotos.map(photo => this.renderPhotoCard(photo)).join('');
    }

    renderPhotoCard(photo) {
        const date = formatDate(photo.photo_time || photo.upload_time);
        const tags = photo.tags || [];
        
        return `
            <div class="photo-card">
                <div class="photo-image-wrapper" onclick="growthAlbumModule.showPhotoDetail('${photo.id}')">
                    <img src="${photo.data_url}" alt="${photo.file_name}" class="photo-image" loading="lazy">
                    <button class="photo-delete-btn" onclick="event.stopPropagation(); growthAlbumModule.deletePhoto('${photo.id}')" title="删除照片">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="photo-info">
                    <div class="photo-date">${date}</div>
                    <div class="photo-tags">
                        ${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    async deletePhoto(photoId) {
        if (!confirm('确定要删除这张照片吗？')) {
            return;
        }

        if (this.supabase) {
            try {
                const { error } = await this.supabase
                    .from('photos')
                    .delete()
                    .eq('id', photoId);
                if (error) throw error;
            } catch (error) {
                console.error('删除失败:', error);
            }
        }

        const photos = storage.get('photos', []);
        const filtered = photos.filter(p => p.id !== photoId);
        storage.set('photos', filtered);

        this.photos = filtered;
        this.renderPhotos();
        showNotification('照片已删除', 'success');
    }

    groupPhotosByMonth(photos) {
        const grouped = {};
        photos.forEach(photo => {
            const date = new Date(photo.photo_time || photo.upload_time);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!grouped[monthKey]) {
                grouped[monthKey] = [];
            }
            grouped[monthKey].push(photo);
        });
        return grouped;
    }

    renderMonthlyView(grouped) {
        const months = Object.keys(grouped).sort().reverse();
        
        if (months.length === 0) {
            return '<p style="text-align: center; color: var(--text-secondary); grid-column: 1/-1;">暂无照片</p>';
        }

        return months.map(month => {
            const photos = grouped[month];
            return `
                <div style="grid-column: 1/-1; margin-top: 2rem;">
                    <h3 style="margin-bottom: 1rem; color: var(--text-primary);">${month}</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.5rem;">
                        ${photos.map(photo => this.renderPhotoCard(photo)).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    setFilter(filter) {
        this.currentFilter = filter;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.renderPhotos();
    }

    showPhotoDetail(photoId) {
        const photo = this.photos.find(p => p.id === photoId);
        if (!photo) return;

        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modal-body');
        
        modalBody.innerHTML = `
            <h2>照片详情</h2>
            <img src="${photo.data_url}" style="width: 100%; max-height: 400px; object-fit: contain; margin: 1rem 0;">
            <p><strong>拍摄时间：</strong>${formatDateTime(photo.photo_time || photo.upload_time)}</p>
            <div class="form-group">
                <label>添加标签</label>
                <input type="text" id="new-tag-input" placeholder="输入标签，按回车添加">
            </div>
            <div class="photo-tags" id="photo-tags-edit">
                ${(photo.tags || []).map(tag => `
                    <span class="tag">${tag} 
                        <i class="fas fa-times" onclick="growthAlbumModule.removeTag('${photo.id}', '${tag}')" style="cursor: pointer; margin-left: 0.5rem;"></i>
                    </span>
                `).join('')}
            </div>
            <div class="form-group" style="margin-top: 1rem;">
                <label>体重（kg）</label>
                <input type="number" id="photo-weight" value="${photo.weight || ''}" step="0.1">
            </div>
            <div class="form-group">
                <label>身长（cm）</label>
                <input type="number" id="photo-length" value="${photo.length || ''}" step="0.1">
            </div>
            <button class="btn btn-primary" onclick="growthAlbumModule.savePhotoDetails('${photo.id}')" style="margin-top: 1rem;">
                <i class="fas fa-save"></i> 保存
            </button>
        `;

        modal.classList.add('active');

        // 标签输入
        const tagInput = document.getElementById('new-tag-input');
        if (tagInput) {
            tagInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const tag = tagInput.value.trim();
                    if (tag) {
                        this.addTag(photo.id, tag);
                        tagInput.value = '';
                    }
                }
            });
        }
    }

    addTag(photoId, tag) {
        const photo = this.photos.find(p => p.id === photoId);
        if (!photo) return;

        if (!photo.tags) photo.tags = [];
        if (!photo.tags.includes(tag)) {
            photo.tags.push(tag);
            this.savePhoto(photo);
            this.showPhotoDetail(photoId);
        }
    }

    removeTag(photoId, tag) {
        const photo = this.photos.find(p => p.id === photoId);
        if (!photo) return;

        if (photo.tags) {
            photo.tags = photo.tags.filter(t => t !== tag);
            this.savePhoto(photo);
            this.showPhotoDetail(photoId);
        }
    }

    async savePhotoDetails(photoId) {
        const photo = this.photos.find(p => p.id === photoId);
        if (!photo) return;

        const weight = document.getElementById('photo-weight').value;
        const length = document.getElementById('photo-length').value;

        photo.weight = weight ? parseFloat(weight) : null;
        photo.length = length ? parseFloat(length) : null;

        await this.savePhoto(photo);
        this.loadPhotos();
        
        const modal = document.getElementById('modal');
        modal.classList.remove('active');
        
        showNotification('照片详情已保存', 'success');
    }
}

// 全局实例（将在app.js中初始化）
// let growthAlbumModule = null;
