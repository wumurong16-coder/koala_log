# 考拉小狗日记 (Koala Dog Log)

个性化宠物健康与成长记录平台，兼具社交分享功能

## 功能模块

### 📦 模块一：健康日志
- **饮食记录**：记录食物类型、分量、喂食时间，可视化每日/每周热量摄入
- **便便健康**：记录排便时间、形态评分（1-5级）、颜色、备注，异常自动提醒
- **遛狗记录**：记录开始/结束时间、路线、运动量，统计周度运动趋势

### 🌱 模块二：成长相册
- **时间轴相册**：按月分类的瀑布流布局，自动提取照片时间
- **智能标签**：AI自动识别场景，支持手动添加标签
- **成长指标**：可附加体重、身长数据到对应月份

### 🤖 模块三：智能体助手
- **健康咨询**：基于记录数据提供健康建议
- **训狗技巧推送**：根据狗狗年龄推荐训练项目
- **预警系统**：异常模式检测和提醒

### 👥 模块四：社交网络
- **关系图谱**：可视化展示人类和狗狗联系人
- **互动记录**：记录社交活动（玩耍、遛狗、拜访等）
- **共享权限**：生成分享链接，设置查看/评论/编辑权限

## 配置说明

### Supabase 配置

1. 打开 `js/config.js` 文件
2. 配置你的 Supabase 信息：

```javascript
const SUPABASE_CONFIG = {
    SUPABASE_URL: 'https://your-project.supabase.co',  // 你的 Project URL
    SUPABASE_ANON_KEY: 'your-anon-key-here',            // 你的 Publishable Key
};
```

### 智能体API配置

1. 打开 `js/config.js` 文件
2. 配置你的智能体API信息：

```javascript
const AI_ASSISTANT_CONFIG = {
    API_URL: 'https://api.example.com/v1/chat',  // 你的智能体API URL
    API_KEY: 'your-api-key-here',                 // 你的API密钥
    TIMEOUT: 30000,                               // 请求超时时间（毫秒）
};
```

**API请求格式说明：**
- 请求方法：POST
- 请求头：
  - `Content-Type: application/json`
  - `Authorization: Bearer {API_KEY}`
- 请求体：
```json
{
    "message": "用户消息",
    "context": {
        "pet_name": "考拉",
        "recent_diet": {...},
        "recent_poop": {...},
        "recent_walk": {...}
    },
    "chat_history": [...]
}
```
- 响应格式：API应返回以下格式之一：
  - `{ "response": "回复内容" }`
  - `{ "message": "回复内容" }`
  - `{ "content": "回复内容" }`
  - `{ "text": "回复内容" }`
  - 或直接返回字符串

**注意：** 如果不配置智能体API，系统会自动使用本地逻辑作为降级方案。

### Supabase 数据库表结构建议

如果需要使用 Supabase 存储数据，建议创建以下表：

#### diet_records (饮食记录)
- id (text, primary key)
- food_type (text)
- amount (numeric)
- feeding_time (timestamp)
- created_at (timestamp)

#### poop_records (便便记录)
- id (text, primary key)
- poop_time (timestamp)
- score (integer, 1-5)
- color (text)
- notes (text)
- created_at (timestamp)

#### walk_records (遛狗记录)
- id (text, primary key)
- walk_start (timestamp)
- walk_end (timestamp)
- route (text)
- calories (numeric)
- duration_minutes (integer)
- created_at (timestamp)

#### photos (照片)
- id (text, primary key)
- file_name (text)
- data_url (text) - 或使用 Supabase Storage
- upload_time (timestamp)
- photo_time (timestamp)
- tags (text[])
- weight (numeric)
- length (numeric)
- created_at (timestamp)

#### contacts (联系人)
- id (text, primary key)
- type (text) - 'human' 或 'dog'
- name (text)
- role (text) - 仅人类
- breed (text) - 仅狗狗
- owner (text) - 仅狗狗
- contact_info (text)
- notes (text)
- created_at (timestamp)

#### interactions (互动记录)
- id (text, primary key)
- type (text) - 'play', 'walk', 'visit', 'other'
- participants (text)
- interaction_time (timestamp)
- notes (text)
- created_at (timestamp)

#### chat_messages (聊天记录)
- id (text, primary key)
- role (text) - 'user' 或 'bot'
- content (text)
- timestamp (timestamp)

## 使用说明

1. 配置 Supabase（可选，如果不配置将使用本地存储）
2. 在浏览器中打开 `index.html`
3. 开始记录你的宠物健康与成长数据

## 技术栈

- 原生 JavaScript (ES6+)
- Chart.js (图表可视化)
- Supabase (后端服务，可选)
- Font Awesome (图标)
- 本地存储 (LocalStorage) 作为降级方案

## 注意事项

- 如果不配置 Supabase，所有数据将存储在浏览器的 LocalStorage 中
- 图片以 Base64 格式存储，建议使用 Supabase Storage 存储大图片
- AI 标签识别功能为简化版本，实际应用需要集成 AI 服务
- 分享链接功能需要服务器端支持才能正常工作

## 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge

建议使用现代浏览器以获得最佳体验。
