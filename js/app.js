/**
 * 主应用入口
 * 初始化所有模块和导航
 */

// 应用初始化
async function initApp() {
    // 初始化 Supabase
    await initSupabase();

    // 初始化所有模块（确保全局可访问）
    window.healthLogModule = new HealthLogModule();
    window.growthAlbumModule = new GrowthAlbumModule();
    window.aiAssistantModule = new AIAssistantModule();
    window.socialNetworkModule = new SocialNetworkModule();

    // 设置模态框
    setupModal();

    // 设置默认时间
    setDefaultTimes();

    console.log('✅ 应用初始化完成');
}

// 模态框设置
function setupModal() {
    const modal = document.getElementById('modal');
    const closeBtn = document.querySelector('.modal-close');

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }

    // 点击模态框外部关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    // ESC键关闭
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            modal.classList.remove('active');
        }
    });
}

// 设置表单默认时间
function setDefaultTimes() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const dateTimeLocal = `${year}-${month}-${day}T${hours}:${minutes}`;
    const dateLocal = `${year}-${month}-${day}`;

    // 设置所有datetime-local输入框的默认值
    document.querySelectorAll('input[type="datetime-local"]').forEach(input => {
        if (!input.value) {
            input.value = dateTimeLocal;
        }
    });

    // 设置date输入框的默认值
    document.querySelectorAll('input[type="date"]').forEach(input => {
        if (!input.value) {
            input.value = dateLocal;
        }
    });
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// 导出全局模块实例供HTML调用
// 注意：这些变量在模块初始化后才会被赋值
