let currentSocialPetId = 1; // 固定为考拉

// 初始化社交数据
async function initSocialData() {
    try {
        const pets = await healthAPI.getPets();
        if (pets && pets.length > 0) {
            currentSocialPetId = pets[0].id;
        }
    } catch (error) {
        console.log('使用默认宠物ID');
    }
    loadSocialData();
}

// 加载社交数据
function loadSocialData() {
    if (currentSocialPetId) {
        loadContacts();
        loadInteractions();
        loadRelationshipGraph();
    }
}

// 切换社交标签
function switchSocialTab(tab) {
    const tabs = ['contacts', 'graph', 'interactions', 'share'];
    tabs.forEach(t => {
        const tabElement = document.getElementById(`${t}Tab`);
        if (tabElement) {
            tabElement.classList.toggle('active', t === tab);
        }
    });
    
    // 更新按钮状态
    document.querySelectorAll('.social-tabs .tab-btn').forEach((btn, index) => {
        btn.classList.toggle('active', tabs[index] === tab);
    });
    
    if (tab === 'graph' && currentSocialPetId) {
        loadRelationshipGraph();
    }
}

// 显示添加人类联系人表单
function showAddHumanContact() {
    const modal = document.getElementById('contactModal');
    const formContent = document.getElementById('contactFormContent');
    
    formContent.innerHTML = `
        <h2>添加人类联系人</h2>
        <div class="auth-form">
            <input type="text" id="humanName" placeholder="姓名 *" required>
            <input type="text" id="humanRole" placeholder="角色 *" required>
            <input type="text" id="humanContactInfo" placeholder="联系方式（选填）">
            <input type="text" id="humanRelationship" placeholder="关系类型（选填）">
            <button class="btn-primary" onclick="submitHumanContact()">提交</button>
            <button class="btn-secondary" onclick="closeContactModal()" style="margin-top: 0.5rem;">取消</button>
        </div>
    `;
    modal.style.display = 'block';
}

// 提交人类联系人
async function submitHumanContact() {
    const name = document.getElementById('humanName').value;
    const role = document.getElementById('humanRole').value;
    
    if (!name || !role) {
        alert('请填写姓名和角色（必填项）');
        return;
    }
    
    const contact = {
        pet_id: parseInt(currentSocialPetId),
        name: name,
        role: role,
        contact_info: document.getElementById('humanContactInfo').value || null,
        relationship_type: document.getElementById('humanRelationship').value || null,
    };
    
    try {
        await socialAPI.addHumanContact(contact);
        closeContactModal();
        loadContacts();
        alert('添加成功！');
    } catch (error) {
        alert('添加失败: ' + error.message);
    }
}

// 显示添加狗狗联系人表单
function showAddDogContact() {
    const modal = document.getElementById('contactModal');
    const formContent = document.getElementById('contactFormContent');
    
    formContent.innerHTML = `
        <h2>添加狗狗联系人</h2>
        <div class="auth-form">
            <input type="text" id="dogName" placeholder="名字 *" required>
            <input type="text" id="dogBreed" placeholder="品种 *" required>
            <input type="text" id="dogOwnerName" placeholder="主人名字（选填）">
            <input type="text" id="dogRelationship" placeholder="关系类型（选填）">
            <button class="btn-primary" onclick="submitDogContact()">提交</button>
            <button class="btn-secondary" onclick="closeContactModal()" style="margin-top: 0.5rem;">取消</button>
        </div>
    `;
    modal.style.display = 'block';
}

// 提交狗狗联系人
async function submitDogContact() {
    const name = document.getElementById('dogName').value;
    const breed = document.getElementById('dogBreed').value;
    
    if (!name || !breed) {
        alert('请填写名字和品种（必填项）');
        return;
    }
    
    const contact = {
        pet_id: parseInt(currentSocialPetId),
        friend_name: name,
        friend_breed: breed,
        owner_name: document.getElementById('dogOwnerName').value || null,
        relationship_type: document.getElementById('dogRelationship').value || null,
    };
    
    try {
        await socialAPI.addDogContact(contact);
        closeContactModal();
        loadContacts();
        alert('添加成功！');
    } catch (error) {
        alert('添加失败: ' + error.message);
    }
}

// 关闭联系人模态框
function closeContactModal() {
    document.getElementById('contactModal').style.display = 'none';
}

// 加载联系人列表
async function loadContacts() {
    if (!currentSocialPetId) return;
    
    try {
        const contacts = await socialAPI.getContacts(currentSocialPetId);
        const container = document.getElementById('contactsList');
        
        let html = '';
        
        if (contacts.humans && contacts.humans.length > 0) {
            html += '<h3 style="margin-bottom: 0.8rem; color: var(--text-color);">人类联系人</h3>';
            html += contacts.humans.map(contact => `
                <div class="contact-card">
                    <h3>${contact.name}</h3>
                    ${contact.role ? `<p>角色: ${contact.role}</p>` : ''}
                    ${contact.contact_info ? `<p>联系方式: ${contact.contact_info}</p>` : ''}
                    ${contact.relationship_type ? `<p>关系: ${contact.relationship_type}</p>` : ''}
                    <button class="btn-secondary" onclick="deleteHumanContact(${contact.id})">删除</button>
                </div>
            `).join('');
        }
        
        if (contacts.dogs && contacts.dogs.length > 0) {
            html += '<h3 style="margin-top: 1.5rem; margin-bottom: 0.8rem; color: var(--text-color);">狗狗联系人</h3>';
            html += contacts.dogs.map(contact => `
                <div class="contact-card">
                    <h3>${contact.friend_name}</h3>
                    ${contact.friend_breed ? `<p>品种: ${contact.friend_breed}</p>` : ''}
                    ${contact.owner_name ? `<p>主人: ${contact.owner_name}</p>` : ''}
                    ${contact.relationship_type ? `<p>关系: ${contact.relationship_type}</p>` : ''}
                    <button class="btn-secondary" onclick="deleteDogContact(${contact.id})">删除</button>
                </div>
            `).join('');
        }
        
        container.innerHTML = html || '<p style="text-align: center; color: var(--text-light);">暂无联系人</p>';
    } catch (error) {
        console.error('加载联系人列表失败:', error);
    }
}

// 删除人类联系人
async function deleteHumanContact(contactId) {
    if (!confirm('确定要删除这个联系人吗？')) return;
    
    try {
        await socialAPI.deleteHumanContact(contactId);
        loadContacts();
    } catch (error) {
        alert('删除失败: ' + error.message);
    }
}

// 删除狗狗联系人
async function deleteDogContact(contactId) {
    if (!confirm('确定要删除这个联系人吗？')) return;
    
    try {
        await socialAPI.deleteDogContact(contactId);
        loadContacts();
    } catch (error) {
        alert('删除失败: ' + error.message);
    }
}

// 加载关系图谱
async function loadRelationshipGraph() {
    if (!currentSocialPetId) return;
    
    try {
        const graph = await socialAPI.getRelationshipGraph(currentSocialPetId);
        const container = document.getElementById('relationshipGraph');
        
        // 简单的文本展示
        let html = '<h3 style="margin-bottom: 1rem;">关系图谱</h3>';
        html += '<div style="margin-bottom: 1.5rem;">';
        
        graph.nodes.forEach(node => {
            const bgColor = node.type === 'pet' ? 'var(--macaron-pink)' : 
                           node.type === 'human' ? 'var(--macaron-blue)' : 'var(--macaron-green)';
            html += `<div style="display: inline-block; padding: 0.5rem 1rem; margin: 0.3rem; background: ${bgColor}; border-radius: 15px; font-size: 0.9rem;">${node.label}</div>`;
        });
        
        html += '</div>';
        html += '<h3 style="margin-top: 1.5rem; margin-bottom: 1rem;">最近互动</h3>';
        html += '<div>';
        
        if (graph.interactions && graph.interactions.length > 0) {
            html += graph.interactions.map(interaction => `
                <div class="record-item" style="margin-bottom: 0.8rem;">
                    <p><strong>${interaction.interaction_type}</strong> - ${new Date(interaction.interaction_date).toLocaleString()}</p>
                    ${interaction.description ? `<p>${interaction.description}</p>` : ''}
                </div>
            `).join('');
        } else {
            html += '<p style="text-align: center; color: var(--text-light);">暂无互动记录</p>';
        }
        
        html += '</div>';
        container.innerHTML = html;
    } catch (error) {
        console.error('加载关系图谱失败:', error);
    }
}

// 显示互动表单
function showInteractionForm() {
    const form = document.getElementById('interactionForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
    if (form.style.display === 'block') {
        document.getElementById('interactionDate').value = new Date().toISOString().slice(0, 16);
    }
}

// 提交互动记录
async function submitInteraction() {
    if (!currentSocialPetId) {
        alert('请先登录');
        return;
    }
    
    const interaction = {
        pet_id: parseInt(currentSocialPetId),
        interaction_type: document.getElementById('interactionType').value,
        target_type: document.getElementById('interactionTargetType').value,
        target_id: document.getElementById('interactionTargetId').value ? parseInt(document.getElementById('interactionTargetId').value) : null,
        interaction_date: document.getElementById('interactionDate').value,
        description: document.getElementById('interactionDescription').value,
    };
    
    try {
        await socialAPI.addInteraction(interaction);
        document.getElementById('interactionForm').style.display = 'none';
        document.getElementById('interactionForm').reset();
        loadInteractions();
    } catch (error) {
        alert('添加失败: ' + error.message);
    }
}

// 加载互动记录
async function loadInteractions() {
    if (!currentSocialPetId) return;
    
    try {
        const interactions = await socialAPI.getInteractions(currentSocialPetId);
        const container = document.getElementById('interactionsList');
        if (interactions.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-light);">暂无互动记录</p>';
            return;
        }
        container.innerHTML = interactions.map(interaction => `
            <div class="record-item">
                <div class="record-item-header">
                    <span class="record-item-title">${interaction.interaction_type}</span>
                    <span class="record-item-time">${new Date(interaction.interaction_date).toLocaleString()}</span>
                </div>
                <div class="record-item-content">
                    <p>类型: ${interaction.target_type}</p>
                    ${interaction.description ? `<p>${interaction.description}</p>` : ''}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('加载互动记录失败:', error);
    }
}

// 显示分享表单
function showShareForm() {
    const form = document.getElementById('shareForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

// 创建分享
async function createShare() {
    if (!currentSocialPetId) {
        alert('请先登录');
        return;
    }
    
    const shareData = {
        pet_id: parseInt(currentSocialPetId),
        module_type: document.getElementById('shareModule').value,
        permission_level: document.getElementById('sharePermission').value,
        expires_days: document.getElementById('shareExpires').value ? parseInt(document.getElementById('shareExpires').value) : null,
    };
    
    try {
        const share = await socialAPI.createShare(shareData);
        document.getElementById('shareForm').style.display = 'none';
        document.getElementById('shareForm').reset();
        loadShareLinks();
        alert(`分享链接已创建: ${share.share_code}`);
    } catch (error) {
        alert('创建分享失败: ' + error.message);
    }
}

// 加载分享链接
async function loadShareLinks() {
    // 这里可以添加获取分享链接列表的API调用
    const container = document.getElementById('shareLinks');
    container.innerHTML = '<p style="text-align: center; color: var(--text-light);">分享链接将显示在这里</p>';
}
