# 快速开始指南

## 第一步：配置 Supabase（可选）

如果你想要使用 Supabase 存储数据，请按以下步骤操作：

1. 访问 [Supabase](https://supabase.com) 并创建账户
2. 创建新项目
3. 在项目设置中找到：
   - **Project URL**（例如：`https://xxxxx.supabase.co`）
   - **Publishable Key**（Anon/Public Key）

4. 打开 `js/config.js` 文件，填入你的配置：

```javascript
const SUPABASE_CONFIG = {
    SUPABASE_URL: 'https://your-project.supabase.co',  // 替换为你的 Project URL
    SUPABASE_ANON_KEY: 'your-anon-key-here',            // 替换为你的 Publishable Key
};
```

**注意**：如果不配置 Supabase，应用会自动使用浏览器的 LocalStorage 存储数据。

### 智能体API配置（可选）

1. 打开 `js/config.js` 文件
2. 配置你的智能体API信息：

```javascript
const AI_ASSISTANT_CONFIG = {
    API_URL: 'https://api.example.com/v1/chat',  // 你的智能体API URL
    API_KEY: 'your-api-key-here',                 // 你的API密钥
    TIMEOUT: 30000,                               // 请求超时时间（毫秒，默认30秒）
};
```

**注意：** 如果不配置智能体API，智能助手会使用本地逻辑提供回复。

## 第二步：打开应用

直接在浏览器中打开 `index.html` 文件即可使用。

## 第三步：开始使用

### 健康日志
- 点击"健康日志"标签
- 选择"饮食记录"、"便便健康"或"遛狗记录"
- 填写表单并保存

### 成长相册
- 点击"成长相册"标签
- 点击"上传照片"按钮
- 选择照片上传，系统会自动添加标签

### 智能助手
- 点击"智能助手"标签
- 在聊天框中输入问题
- 助手会根据你的记录数据提供建议

### 社交网络
- 点击"社交网络"标签
- 添加联系人（人类或狗狗）
- 记录社交互动
- 生成分享链接

## 数据存储

- **使用 Supabase**：数据存储在云端，可在多设备间同步
- **使用 LocalStorage**：数据存储在浏览器本地，清除浏览器数据会丢失

## 常见问题

### Q: 如何备份数据？
A: 如果使用 Supabase，数据自动备份。如果使用 LocalStorage，可以导出浏览器数据。

### Q: 图片存储在哪里？
A: 当前版本以 Base64 格式存储在 LocalStorage 或 Supabase 数据库中。建议使用 Supabase Storage 存储大图片。

### Q: AI 标签识别不准确？
A: 当前版本使用简化的标签识别。实际应用需要集成 OpenAI API 或其他 AI 服务。

## 技术支持

如有问题，请查看 `readme.md` 获取更多信息。
