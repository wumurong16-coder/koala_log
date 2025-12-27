let currentUser = null;

// 显示登录模态框
function showLoginModal() {
    document.getElementById('authModal').style.display = 'block';
    switchTab('login');
}

// 关闭登录模态框
function closeAuthModal() {
    document.getElementById('authModal').style.display = 'none';
}

// 切换登录/注册标签
function switchTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabs = document.querySelectorAll('.tab-btn');
    
    tabs.forEach(t => t.classList.remove('active'));
    
    if (tab === 'login') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        tabs[0].classList.add('active');
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        tabs[1].classList.add('active');
    }
}

// 登录
async function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!username || !password) {
        alert('请填写用户名和密码');
        return;
    }
    
    try {
        const response = await authAPI.login(username, password);
        setToken(response.token);
        currentUser = response.user;
        updateUserUI();
        closeAuthModal();
        // 初始化所有模块
        initAllModules();
    } catch (error) {
        alert('登录失败: ' + error.message);
    }
}

// 注册
async function register() {
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    
    if (!username || !email || !password) {
        alert('请填写所有字段');
        return;
    }
    
    try {
        const response = await authAPI.register(username, email, password);
        setToken(response.token);
        currentUser = response.user;
        updateUserUI();
        closeAuthModal();
        alert('注册成功！');
        // 初始化所有模块
        initAllModules();
    } catch (error) {
        alert('注册失败: ' + error.message);
    }
}

// 退出登录
function logout() {
    clearToken();
    currentUser = null;
    updateUserUI();
    location.reload();
}

// 更新用户UI
function updateUserUI() {
    const userInfo = document.getElementById('userInfo');
    const btnLogin = document.getElementById('btnLogin');
    
    if (currentUser || getToken()) {
        userInfo.style.display = 'block';
        btnLogin.style.display = 'none';
        if (currentUser) {
            document.getElementById('username').textContent = currentUser.username;
        }
    } else {
        userInfo.style.display = 'none';
        btnLogin.style.display = 'block';
    }
}

// 检查登录状态
function checkAuth() {
    const token = getToken();
    if (token) {
        // 可以在这里验证token有效性
        updateUserUI();
    }
}

// 页面加载时检查登录状态
checkAuth();

