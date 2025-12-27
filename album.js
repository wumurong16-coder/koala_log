let currentAlbumPetId = 1; // 固定为考拉

// 初始化相册数据
async function initAlbumData() {
    try {
        const pets = await healthAPI.getPets();
        if (pets && pets.length > 0) {
            currentAlbumPetId = pets[0].id;
        }
    } catch (error) {
        console.log('使用默认宠物ID');
    }
    loadAlbumData();
}

// 加载相册数据
async function loadAlbumData() {
    if (!currentAlbumPetId) return;
    
    await Promise.all([
        loadPhotos(),
        loadMonths()
    ]);
}

// 显示照片上传表单
function showPhotoUploadForm() {
    if (!currentAlbumPetId) {
        alert('请先登录');
        return;
    }
    document.getElementById('photoUploadForm').style.display = 'block';
    document.getElementById('photoTime').value = new Date().toISOString().slice(0, 16);
}

// 关闭照片上传表单
function closePhotoUploadForm() {
    document.getElementById('photoUploadForm').style.display = 'none';
    document.getElementById('photoUploadForm').querySelector('form')?.reset();
}

// 上传照片
async function uploadPhoto() {
    if (!currentAlbumPetId) {
        alert('请先登录');
        return;
    }
    
    const fileInput = document.getElementById('photoFile');
    if (!fileInput.files[0]) {
        alert('请选择照片');
        return;
    }
    
    const formData = new FormData();
    formData.append('photo', fileInput.files[0]);
    formData.append('pet_id', currentAlbumPetId);
    formData.append('photo_time', document.getElementById('photoTime').value);
    formData.append('description', document.getElementById('photoDescription').value);
    
    const weight = document.getElementById('photoWeight').value;
    if (weight) formData.append('weight', weight);
    
    const length = document.getElementById('photoLength').value;
    if (length) formData.append('length', length);
    
    const manualTags = document.getElementById('photoManualTags').value;
    if (manualTags) formData.append('manual_tags', manualTags);
    
    try {
        await albumAPI.uploadPhoto(formData);
        closePhotoUploadForm();
        loadPhotos();
        alert('上传成功！');
    } catch (error) {
        alert('上传失败: ' + error.message);
    }
}

// 加载照片
async function loadPhotos() {
    if (!currentAlbumPetId) return;
    
    const month = document.getElementById('monthFilter').value;
    
    try {
        const photos = await albumAPI.getPhotos(currentAlbumPetId, month);
        const container = document.getElementById('photoGrid');
        
        if (photos.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-light); grid-column: 1/-1;">暂无照片</p>';
            return;
        }
        
        container.innerHTML = photos.map(photo => {
            const allTags = [...(photo.ai_tags || []), ...(photo.manual_tags || [])];
            return `
                <div class="photo-item">
                    <img src="http://localhost:3000${photo.photo_url}" alt="${photo.description || '照片'}" loading="lazy">
                    <div class="photo-item-info">
                        <p>${new Date(photo.photo_time).toLocaleDateString()}</p>
                        ${photo.description ? `<p>${photo.description}</p>` : ''}
                        ${allTags.length > 0 ? `
                            <div class="photo-tags">
                                ${allTags.map(tag => `<span class="photo-tag">${tag}</span>`).join('')}
                            </div>
                        ` : ''}
                        ${photo.weight || photo.length ? `
                            <p>
                                ${photo.weight ? `体重: ${photo.weight}kg` : ''}
                                ${photo.length ? `身长: ${photo.length}cm` : ''}
                            </p>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('加载照片失败:', error);
    }
}

// 加载月份列表
async function loadMonths() {
    if (!currentAlbumPetId) return;
    
    try {
        const months = await albumAPI.getMonths(currentAlbumPetId);
        const selector = document.getElementById('monthFilter');
        selector.innerHTML = '<option value="">全部月份</option>';
        months.forEach(month => {
            const option = document.createElement('option');
            option.value = month;
            option.textContent = month;
            selector.appendChild(option);
        });
    } catch (error) {
        console.error('加载月份列表失败:', error);
    }
}
