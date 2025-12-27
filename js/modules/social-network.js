/**
 * 社交网络模块
 * 包含：关系图谱、互动记录、共享权限
 */

class SocialNetworkModule {
    constructor() {
        this.supabase = getSupabaseClient();
        this.contacts = [];
        this.interactions = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadContacts();
        this.loadInteractions();
    }

    setupEventListeners() {
        // 标签页切换
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.closest('#social-network')) {
                btn.addEventListener('click', (e) => {
                    const tabName = e.target.dataset.tab;
                    this.switchTab(tabName);
                });
            }
        });

        // 添加联系人
        const addContactBtn = document.getElementById('add-contact-btn');
        if (addContactBtn) {
            addContactBtn.addEventListener('click', () => {
                this.showAddContactModal();
            });
        }

        // 互动记录表单
        const interactionForm = document.getElementById('interaction-form');
        if (interactionForm) {
            interactionForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addInteraction();
            });
        }

    }

    switchTab(tabName) {
        document.querySelectorAll('#social-network .tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        document.querySelectorAll('#social-network .tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });

        if (tabName === 'relationship') {
            this.renderRelationshipGraph();
        }
    }

    showAddContactModal() {
        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modal-body');

        modalBody.innerHTML = `
            <h2>添加联系人</h2>
            <form id="add-contact-form">
                <div class="form-group">
                    <label>联系人类型</label>
                    <select id="contact-type" required>
                        <option value="human">人类</option>
                        <option value="dog">狗狗</option>
                    </select>
                </div>
                <div class="form-group">
                    <label id="name-label">姓名 <span style="color: var(--danger-color);">*</span></label>
                    <input type="text" id="contact-name" required>
                </div>
                <div class="form-group" id="role-group">
                    <label>角色 <span style="color: var(--danger-color);">*</span></label>
                    <input type="text" id="contact-role" placeholder="例如：主人、朋友、兽医" required>
                </div>
                <div class="form-group" id="breed-group" style="display: none;">
                    <label>品种 <span style="color: var(--danger-color);">*</span></label>
                    <input type="text" id="contact-breed" placeholder="例如：金毛、柴犬" required>
                </div>
                <div class="form-group" id="owner-group" style="display: none;">
                    <label>主人</label>
                    <input type="text" id="contact-owner" placeholder="主人姓名">
                </div>
                <div class="form-group">
                    <label>联系方式</label>
                    <input type="text" id="contact-info" placeholder="电话、微信等">
                </div>
                <div class="form-group">
                    <label>备注</label>
                    <textarea id="contact-notes" rows="3"></textarea>
                </div>
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-save"></i> 保存
                </button>
            </form>
        `;

        modal.classList.add('active');

        // 联系人类型切换
        const contactType = document.getElementById('contact-type');
        const handleTypeChange = (e) => {
            const isDog = e.target.value === 'dog';
            const roleGroup = document.getElementById('role-group');
            const breedGroup = document.getElementById('breed-group');
            const ownerGroup = document.getElementById('owner-group');
            const roleInput = document.getElementById('contact-role');
            const breedInput = document.getElementById('contact-breed');
            const nameLabel = document.getElementById('name-label');
            
            if (isDog) {
                roleGroup.style.display = 'none';
                breedGroup.style.display = 'block';
                ownerGroup.style.display = 'block';
                nameLabel.innerHTML = '名字 <span style="color: var(--danger-color);">*</span>';
                roleInput.removeAttribute('required');
                breedInput.setAttribute('required', 'required');
            } else {
                roleGroup.style.display = 'block';
                breedGroup.style.display = 'none';
                ownerGroup.style.display = 'none';
                nameLabel.innerHTML = '姓名 <span style="color: var(--danger-color);">*</span>';
                roleInput.setAttribute('required', 'required');
                breedInput.removeAttribute('required');
            }
        };
        contactType.addEventListener('change', handleTypeChange);
        // 初始化显示状态
        handleTypeChange({ target: contactType });

        // 表单提交
        const form = document.getElementById('add-contact-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveContact();
        });
    }

    async saveContact() {
        const type = document.getElementById('contact-type').value;
        const name = document.getElementById('contact-name').value.trim();
        const role = document.getElementById('contact-role').value.trim();
        const breed = document.getElementById('contact-breed').value.trim();
        const owner = document.getElementById('contact-owner').value.trim();
        const info = document.getElementById('contact-info').value.trim();
        const notes = document.getElementById('contact-notes').value.trim();

        // 验证必填项
        if (!name) {
            showNotification('请填写姓名/名字', 'error');
            return;
        }

        if (type === 'human') {
            if (!role) {
                showNotification('请填写角色', 'error');
                return;
            }
        } else if (type === 'dog') {
            if (!breed) {
                showNotification('请填写品种', 'error');
                return;
            }
        }

        const contact = {
            id: generateId(),
            type: type,
            name: name,
            role: type === 'human' ? role : null,
            breed: type === 'dog' ? breed : null,
            owner: type === 'dog' ? owner : null,
            contact_info: info || null,
            notes: notes || null,
            created_at: new Date().toISOString()
        };

        if (this.supabase) {
            try {
                const { error } = await this.supabase
                    .from('contacts')
                    .insert([contact]);
                if (error) throw error;
            } catch (error) {
                console.error('保存失败:', error);
            }
        }
        
        // 无论是否使用Supabase，都保存到本地作为备份
        this.saveContactLocal(contact);
        this.contacts.push(contact);
        this.renderRelationshipGraph();

        const modal = document.getElementById('modal');
        modal.classList.remove('active');

        showNotification('联系人已添加', 'success');
    }

    saveContactLocal(contact) {
        const contacts = storage.get('contacts', []);
        contacts.push(contact);
        storage.set('contacts', contacts);
    }

    async loadContacts() {
        let contacts = [];

        if (this.supabase) {
            try {
                const { data, error } = await this.supabase
                    .from('contacts')
                    .select('*')
                    .order('created_at', { ascending: false });
                if (error) {
                    if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
                        contacts = storage.get('contacts', []);
                    } else {
                        throw error;
                    }
                } else {
                    contacts = data || [];
                }
            } catch (error) {
                contacts = storage.get('contacts', []);
            }
        } else {
            contacts = storage.get('contacts', []);
        }

        this.contacts = contacts;
        this.renderRelationshipGraph();
    }

    renderRelationshipGraph() {
        const container = document.getElementById('relationship-graph');
        if (!container) return;

        if (this.contacts.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: var(--text-secondary);">
                    <i class="fas fa-users" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <p>还没有联系人，点击"添加联系人"开始建立关系网络</p>
                </div>
            `;
            return;
        }

        // 简化的关系图展示
        const humans = this.contacts.filter(c => c.type === 'human');
        const dogs = this.contacts.filter(c => c.type === 'dog');

        let html = '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">';

        // 人类朋友和狗狗朋友横向排列
        // 人类朋友
        html += '<div>';
        html += '<h3 style="margin-bottom: 1rem;">人类朋友</h3>';
        html += '<div style="display: flex; flex-direction: column; gap: 1rem;">';
        humans.forEach(contact => {
            html += `
                <div class="contact-card" style="background: var(--card-bg); padding: 1rem; border-radius: 12px; box-shadow: var(--shadow); position: relative;">
                    <div style="font-weight: 600; margin-bottom: 0.5rem;">${contact.name}</div>
                    ${contact.role ? `<div style="color: var(--text-secondary); font-size: 0.9rem;">角色: ${contact.role}</div>` : ''}
                    ${contact.contact_info ? `<div style="color: var(--text-secondary); font-size: 0.9rem;">${contact.contact_info}</div>` : ''}
                    <div style="position: absolute; top: 0.5rem; right: 0.5rem; display: flex; gap: 0.5rem;">
                        <button onclick="socialNetworkModule.editContact('${contact.id}')" style="background: none; border: none; cursor: pointer; color: var(--macaron-green); padding: 0.25rem; border-radius: 4px; transition: all 0.3s;" onmouseover="this.style.background='rgba(212,241,197,0.3)'" onmouseout="this.style.background='none'">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="socialNetworkModule.deleteContact('${contact.id}')" style="background: none; border: none; cursor: pointer; color: var(--danger-color); padding: 0.25rem; border-radius: 4px; transition: all 0.3s;" onmouseover="this.style.background='rgba(255,182,193,0.3)'" onmouseout="this.style.background='none'">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        html += '</div></div>';

        // 狗狗朋友
        html += '<div>';
        html += '<h3 style="margin-bottom: 1rem;">狗狗朋友</h3>';
        html += '<div style="display: flex; flex-direction: column; gap: 1rem;">';
        dogs.forEach(contact => {
            html += `
                <div class="contact-card" style="background: var(--card-bg); padding: 1rem; border-radius: 12px; box-shadow: var(--shadow); position: relative;">
                    <div style="font-weight: 600; margin-bottom: 0.5rem;">🐕 ${contact.name}</div>
                    ${contact.breed ? `<div style="color: var(--text-secondary); font-size: 0.9rem;">品种: ${contact.breed}</div>` : ''}
                    ${contact.owner ? `<div style="color: var(--text-secondary); font-size: 0.9rem;">主人: ${contact.owner}</div>` : ''}
                    <div style="position: absolute; top: 0.5rem; right: 0.5rem; display: flex; gap: 0.5rem;">
                        <button onclick="socialNetworkModule.editContact('${contact.id}')" style="background: none; border: none; cursor: pointer; color: var(--macaron-green); padding: 0.25rem; border-radius: 4px; transition: all 0.3s;" onmouseover="this.style.background='rgba(212,241,197,0.3)'" onmouseout="this.style.background='none'">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="socialNetworkModule.deleteContact('${contact.id}')" style="background: none; border: none; cursor: pointer; color: var(--danger-color); padding: 0.25rem; border-radius: 4px; transition: all 0.3s;" onmouseover="this.style.background='rgba(255,182,193,0.3)'" onmouseout="this.style.background='none'">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        html += '</div></div>';

        html += '</div>';
        container.innerHTML = html;
    }

    async deleteContact(id) {
        if (!confirm('确定要删除这个联系人吗？')) {
            return;
        }

        if (this.supabase) {
            try {
                const { error } = await this.supabase
                    .from('contacts')
                    .delete()
                    .eq('id', id);
                if (error) throw error;
            } catch (error) {
                console.error('删除失败:', error);
            }
        }

        const contacts = storage.get('contacts', []);
        const filtered = contacts.filter(c => c.id !== id);
        storage.set('contacts', filtered);

        this.contacts = filtered;
        this.renderRelationshipGraph();
        showNotification('联系人已删除', 'success');
    }

    editContact(id) {
        const contact = this.contacts.find(c => c.id === id);
        if (!contact) return;

        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modal-body');

        modalBody.innerHTML = `
            <h2>编辑联系人</h2>
            <form id="edit-contact-form">
                <div class="form-group">
                    <label>联系人类型</label>
                    <select id="edit-contact-type" required>
                        <option value="human" ${contact.type === 'human' ? 'selected' : ''}>人类朋友</option>
                        <option value="dog" ${contact.type === 'dog' ? 'selected' : ''}>狗狗</option>
                    </select>
                </div>
                <div class="form-group">
                    <label id="edit-name-label">${contact.type === 'human' ? '姓名' : '名字'} <span style="color: var(--danger-color);">*</span></label>
                    <input type="text" id="edit-contact-name" value="${contact.name}" required>
                </div>
                <div class="form-group" id="edit-role-group" style="display: ${contact.type === 'human' ? 'block' : 'none'};">
                    <label>角色 <span style="color: var(--danger-color);">*</span></label>
                    <input type="text" id="edit-contact-role" value="${contact.role || ''}" ${contact.type === 'human' ? 'required' : ''}>
                </div>
                <div class="form-group" id="edit-breed-group" style="display: ${contact.type === 'dog' ? 'block' : 'none'};">
                    <label>品种 <span style="color: var(--danger-color);">*</span></label>
                    <input type="text" id="edit-contact-breed" value="${contact.breed || ''}" ${contact.type === 'dog' ? 'required' : ''}>
                </div>
                <div class="form-group" id="edit-owner-group" style="display: ${contact.type === 'dog' ? 'block' : 'none'};">
                    <label>主人</label>
                    <input type="text" id="edit-contact-owner" value="${contact.owner || ''}">
                </div>
                <div class="form-group">
                    <label>联系方式</label>
                    <input type="text" id="edit-contact-info" value="${contact.contact_info || ''}">
                </div>
                <div class="form-group">
                    <label>备注</label>
                    <textarea id="edit-contact-notes" rows="3">${contact.notes || ''}</textarea>
                </div>
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-save"></i> 保存
                </button>
            </form>
        `;

        modal.classList.add('active');

        // 联系人类型切换
        const contactType = document.getElementById('edit-contact-type');
        const handleTypeChange = (e) => {
            const isDog = e.target.value === 'dog';
            const roleGroup = document.getElementById('edit-role-group');
            const breedGroup = document.getElementById('edit-breed-group');
            const ownerGroup = document.getElementById('edit-owner-group');
            const roleInput = document.getElementById('edit-contact-role');
            const breedInput = document.getElementById('edit-contact-breed');
            const nameLabel = document.getElementById('edit-name-label');
            
            if (isDog) {
                roleGroup.style.display = 'none';
                breedGroup.style.display = 'block';
                ownerGroup.style.display = 'block';
                nameLabel.innerHTML = '名字 <span style="color: var(--danger-color);">*</span>';
                roleInput.removeAttribute('required');
                breedInput.setAttribute('required', 'required');
            } else {
                roleGroup.style.display = 'block';
                breedGroup.style.display = 'none';
                ownerGroup.style.display = 'none';
                nameLabel.innerHTML = '姓名 <span style="color: var(--danger-color);">*</span>';
                roleInput.setAttribute('required', 'required');
                breedInput.removeAttribute('required');
            }
        };
        contactType.addEventListener('change', handleTypeChange);

        // 表单提交
        const form = document.getElementById('edit-contact-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateContact(id);
        });
    }

    async updateContact(id) {
        const type = document.getElementById('edit-contact-type').value;
        const name = document.getElementById('edit-contact-name').value.trim();
        const role = document.getElementById('edit-contact-role').value.trim();
        const breed = document.getElementById('edit-contact-breed').value.trim();
        const owner = document.getElementById('edit-contact-owner').value.trim();
        const info = document.getElementById('edit-contact-info').value.trim();
        const notes = document.getElementById('edit-contact-notes').value.trim();

        // 验证必填项
        if (!name) {
            showNotification('请填写姓名/名字', 'error');
            return;
        }

        if (type === 'human') {
            if (!role) {
                showNotification('请填写角色', 'error');
                return;
            }
        } else if (type === 'dog') {
            if (!breed) {
                showNotification('请填写品种', 'error');
                return;
            }
        }

        const contact = {
            id: id,
            type: type,
            name: name,
            role: type === 'human' ? role : null,
            breed: type === 'dog' ? breed : null,
            owner: type === 'dog' ? owner : null,
            contact_info: info || null,
            notes: notes || null,
            created_at: this.contacts.find(c => c.id === id)?.created_at || new Date().toISOString()
        };

        if (this.supabase) {
            try {
                const { error } = await this.supabase
                    .from('contacts')
                    .update(contact)
                    .eq('id', id);
                if (error) throw error;
            } catch (error) {
                console.error('更新失败:', error);
            }
        }
        
        // 更新本地存储
        const contacts = storage.get('contacts', []);
        const index = contacts.findIndex(c => c.id === id);
        if (index !== -1) {
            contacts[index] = contact;
            storage.set('contacts', contacts);
        }

        this.contacts = contacts;
        this.renderRelationshipGraph();

        const modal = document.getElementById('modal');
        modal.classList.remove('active');

        showNotification('联系人已更新', 'success');
    }

    async addInteraction() {
        const type = document.getElementById('interaction-type').value;
        const participants = document.getElementById('interaction-participants').value;
        const time = document.getElementById('interaction-time').value;
        const notes = document.getElementById('interaction-notes').value;

        if (!time) {
            showNotification('请填写活动时间', 'error');
            return;
        }

        const interaction = {
            id: generateId(),
            type: type,
            participants: participants,
            interaction_time: time,
            notes: notes,
            created_at: new Date().toISOString()
        };

        if (this.supabase) {
            try {
                const { error } = await this.supabase
                    .from('interactions')
                    .insert([interaction]);
                if (error) throw error;
            } catch (error) {
                console.error('保存失败:', error);
                this.saveInteractionLocal(interaction);
            }
        } else {
            this.saveInteractionLocal(interaction);
        }

        showNotification('互动记录已保存', 'success');
        document.getElementById('interaction-form').reset();
        this.loadInteractions();
    }

    saveInteractionLocal(interaction) {
        const interactions = storage.get('interactions', []);
        interactions.push(interaction);
        // 按时间倒序排列（最新的在前）
        interactions.sort((a, b) => new Date(b.interaction_time) - new Date(a.interaction_time));
        storage.set('interactions', interactions);
    }

    async loadInteractions() {
        let interactions = [];

        if (this.supabase) {
            try {
                const { data, error } = await this.supabase
                    .from('interactions')
                    .select('*')
                    .order('interaction_time', { ascending: false })
                    .limit(50);
                if (error) {
                    if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
                        interactions = storage.get('interactions', []);
                    } else {
                        throw error;
                    }
                } else {
                    interactions = data || [];
                }
            } catch (error) {
                interactions = storage.get('interactions', []);
            }
        } else {
            interactions = storage.get('interactions', []);
        }

        // 确保倒序排列（最新的在前）
        interactions.sort((a, b) => new Date(b.interaction_time) - new Date(a.interaction_time));
        this.interactions = interactions;
        this.renderInteractions();
    }

    renderInteractions() {
        const container = document.getElementById('interaction-records');
        if (!container) return;

        if (this.interactions.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">暂无记录</p>';
            return;
        }

        const typeLabels = {
            play: '玩耍',
            walk: '一起遛狗',
            visit: '拜访',
            other: '其他'
        };

        container.innerHTML = this.interactions.map(interaction => `
            <div class="record-card">
                <div class="record-info">
                    <div class="record-title">${typeLabels[interaction.type] || interaction.type}</div>
                    <div class="record-meta">
                        ${formatDateTime(interaction.interaction_time)}
                        ${interaction.participants ? ` · ${interaction.participants}` : ''}
                        ${interaction.notes ? `<br>${interaction.notes}` : ''}
                    </div>
                </div>
                <div class="record-actions">
                    <button onclick="socialNetworkModule.deleteInteraction('${interaction.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    async deleteInteraction(id) {
        if (this.supabase) {
            try {
                const { error } = await this.supabase
                    .from('interactions')
                    .delete()
                    .eq('id', id);
                if (error) throw error;
            } catch (error) {
                console.error('删除失败:', error);
            }
        }

        const interactions = storage.get('interactions', []);
        const filtered = interactions.filter(i => i.id !== id);
        storage.set('interactions', filtered);

        this.loadInteractions();
    }

}

// 全局实例（将在app.js中初始化）
// let socialNetworkModule = null;
