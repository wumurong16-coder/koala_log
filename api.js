// API配置
const API_BASE_URL = 'http://localhost:3000/api';

// 获取token
function getToken() {
    return localStorage.getItem('token');
}

// 设置token
function setToken(token) {
    localStorage.setItem('token', token);
}

// 清除token
function clearToken() {
    localStorage.removeItem('token');
}

// 通用API请求函数
async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    if (token) {
        defaultOptions.headers['Authorization'] = `Bearer ${token}`;
    }
    
    const config = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...(options.headers || {}),
        },
    };
    
    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || '请求失败');
        }
        
        return data;
    } catch (error) {
        console.error('API请求错误:', error);
        throw error;
    }
}

// 认证API
const authAPI = {
    register: (username, email, password) => 
        apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password }),
        }),
    
    login: (username, password) => 
        apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        }),
};

// 健康日志API
const healthAPI = {
    getPets: () => apiRequest('/health/pets'),
    
    createPet: (petData) => 
        apiRequest('/health/pets', {
            method: 'POST',
            body: JSON.stringify(petData),
        }),
    
    addDietRecord: (record) => 
        apiRequest('/health/diet', {
            method: 'POST',
            body: JSON.stringify(record),
        }),
    
    getDietRecords: (petId, startDate, endDate) => {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        return apiRequest(`/health/diet/${petId}?${params.toString()}`);
    },
    
    addPoopRecord: (record) => 
        apiRequest('/health/poop', {
            method: 'POST',
            body: JSON.stringify(record),
        }),
    
    getPoopRecords: (petId, startDate, endDate) => {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        return apiRequest(`/health/poop/${petId}?${params.toString()}`);
    },
    
    addWalkRecord: (record) => 
        apiRequest('/health/walk', {
            method: 'POST',
            body: JSON.stringify(record),
        }),
    
    getWalkRecords: (petId, startDate, endDate) => {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        return apiRequest(`/health/walk/${petId}?${params.toString()}`);
    },
    
    getStats: (petId, period = 'week') => 
        apiRequest(`/health/stats/${petId}?period=${period}`),
};

// 相册API
const albumAPI = {
    uploadPhoto: async (formData) => {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/album/photos`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || '上传失败');
        }
        return data;
    },
    
    getPhotos: (petId, month) => {
        const params = new URLSearchParams();
        if (month) params.append('month', month);
        return apiRequest(`/album/photos/${petId}?${params.toString()}`);
    },
    
    getMonths: (petId) => apiRequest(`/album/months/${petId}`),
    
    addGrowthIndicator: (indicator) => 
        apiRequest('/album/growth', {
            method: 'POST',
            body: JSON.stringify(indicator),
        }),
    
    getGrowthIndicators: (petId) => apiRequest(`/album/growth/${petId}`),
    
    updatePhoto: (photoId, updates) => 
        apiRequest(`/album/photos/${photoId}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        }),
};

// AI助手API
const aiAPI = {
    chat: (petId, message) => 
        apiRequest('/ai/chat', {
            method: 'POST',
            body: JSON.stringify({ pet_id: petId, message }),
        }),
    
    getHealthAdvice: (petId) => apiRequest(`/ai/advice/${petId}`),
    
    getTrainingTips: (petId, ageGroup) => {
        const params = new URLSearchParams();
        if (ageGroup) params.append('age_group', ageGroup);
        return apiRequest(`/ai/training-tips/${petId}?${params.toString()}`);
    },
    
    detectAnomalies: (petId) => 
        apiRequest(`/ai/detect-anomalies/${petId}`, {
            method: 'POST',
        }),
    
    getAlerts: (petId, resolved) => {
        const params = new URLSearchParams();
        if (resolved !== undefined) params.append('resolved', resolved);
        return apiRequest(`/ai/alerts/${petId}?${params.toString()}`);
    },
    
    resolveAlert: (alertId) => 
        apiRequest(`/ai/alerts/${alertId}/resolve`, {
            method: 'PUT',
        }),
    
    getConversations: (petId, limit = 50) => 
        apiRequest(`/ai/conversations/${petId}?limit=${limit}`),
};

// 社交网络API
const socialAPI = {
    addHumanContact: (contact) => 
        apiRequest('/social/contacts/human', {
            method: 'POST',
            body: JSON.stringify(contact),
        }),
    
    addDogContact: (contact) => 
        apiRequest('/social/contacts/dog', {
            method: 'POST',
            body: JSON.stringify(contact),
        }),
    
    getContacts: (petId) => apiRequest(`/social/contacts/${petId}`),
    
    addInteraction: (interaction) => 
        apiRequest('/social/interactions', {
            method: 'POST',
            body: JSON.stringify(interaction),
        }),
    
    getInteractions: (petId, limit = 30) => 
        apiRequest(`/social/interactions/${petId}?limit=${limit}`),
    
    createShare: (shareData) => 
        apiRequest('/social/share', {
            method: 'POST',
            body: JSON.stringify(shareData),
        }),
    
    getShare: (shareCode) => apiRequest(`/social/share/${shareCode}`),
    
    getRelationshipGraph: (petId) => apiRequest(`/social/relationship-graph/${petId}`),
    
    deleteHumanContact: (contactId) => 
        apiRequest(`/social/contacts/human/${contactId}`, {
            method: 'DELETE',
        }),
    
    deleteDogContact: (contactId) => 
        apiRequest(`/social/contacts/dog/${contactId}`, {
            method: 'DELETE',
        }),
};

