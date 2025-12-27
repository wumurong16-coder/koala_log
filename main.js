// 页面初始化
document.addEventListener('DOMContentLoaded', () => {
    // 检查登录状态
    checkAuth();
    
    // 如果有token，初始化所有模块
    if (getToken()) {
        initAllModules();
    }
});

// 初始化所有模块
async function initAllModules() {
    await Promise.all([
        initHealthData(),
        initAlbumData(),
        initAIData(),
        initSocialData()
    ]);
}

// 点击模态框外部关闭
window.onclick = function(event) {
    const authModal = document.getElementById('authModal');
    const photoModal = document.getElementById('photoUploadForm');
    const contactModal = document.getElementById('contactModal');
    
    if (event.target === authModal) {
        closeAuthModal();
    }
    if (event.target === photoModal) {
        closePhotoUploadForm();
    }
    if (event.target === contactModal) {
        closeContactModal();
    }
}
