# OmniEnglish 项目总结与改进建议

## 项目概述

OmniEnglish 是一个面向 CET-4 考生的英语学习平台，部署在 omnienglish.github.io。采用单 HTML 文件架构，零依赖、零构建工具，国内直连。

---

## 已完成功能

### 1. 高频词汇墙
- 4544 CET-4 词汇，按 BNC 词频 + 优先级排序
- 间隔重复调度引擎 WordScheduler（忘记→+2，模糊→+5，已掌握→移出）
- 词库切换（核心词/四级/补充词），切换时自动退出当前学习会话
- 单词卡牌正反面翻转，正面显示音标+朗读，背面显示释义+例句+词频标签
- 自定义卡牌背景（8 预设主题 + 自定义图片上传 + 裁剪 + 透明度调节）
- 例句中英文单词可点击，弹出释义卡牌（含朗读、加入生词本）
- 学习进度条 + 每日学习量设置

### 2. 复习模式
- 选择题形式，根据遗忘曲线自动安排复习
- 生词本收藏功能，数据持久化到 localStorage + 云端同步

### 3. 写作/翻译模考
- DeepSeek API 驱动，精准评分
- 写作和翻译两种模式
- API Key 存 localStorage

### 4. 真题长难句 + CS 术语
- 逐句拆解，点击单词即查
- 计算机专业英语词汇

### 5. Dashboard
- CET-4 倒计时（hero 天数 + 时分秒 + 进度条 + 统计卡片）
- GitHub 风格学习热力图（6 个月，5 级绿色，星期/月份标签，hover tooltip）
- 连续学习天数统计
- 英语完全进化进度条

### 6. 数据同步
- Cloudflare Worker 代理 Firebase REST API（国内可直连）
- 匿名认证，无需注册
- localStorage + 云端双写

### 7. 其他
- Live2D 看板娘（可拖拽）
- 响应式侧栏导航 + 底部导航栏
- 暗色/亮色主题

---

## 技术架构

```
index.html (~4500 行)
├── CSS: 自定义属性主题系统，oklch 色彩
├── JS: 原生 vanilla，零框架
│   ├── WordScheduler: 间隔重复调度引擎
│   ├── ReviewScheduler: Object.create(WordScheduler)
│   ├── Store: localStorage + 云端同步
│   ├── renderVocabCardUI: 纯函数，卡片 HTML 生成
│   └── 各模块功能函数
└── HTML: 页面结构 + 内联组件

vocab.json: 4544 CET-4 词汇（word, phonetic, def, priority, bnc, cet4, cet4zh, cs, cszh）
cf-worker.js: Cloudflare Worker（Firebase Auth + Firestore REST API 代理）
```

---

## 改进建议

### 高优先级

#### 1. 移动端适配
- 当前卡片在小屏上体验一般，需要响应式优化
- 建议：卡片最小高度自适应、字体大小按屏幕缩放、底部导航栏优化触控区域

#### 2. 数据导出/导入
- 用户换设备时云端同步是唯一途径，应增加本地数据导出功能
- 建议：JSON 格式导出/导入，支持合并或覆盖模式

#### 3. 单文件拆分
- 4500+ 行单文件维护成本越来越高
- 建议：拆为 `style.css` + `app.js`（按模块拆分），GitHub Pages 照样能跑
- 或者用简单的构建脚本合并发布

### 中优先级

#### 4. 模考功能增强
- 当前只有 AI 评分，缺少计时、错题集、历史记录
- 建议：增加倒计时、错题自动归档、模考历史对比

#### 5. 词汇学习统计
- 当前热力图只记录"已掌握"数量，缺少详细统计
- 建议：记录每日学习时长、正确率、遗忘率，生成学习报告

#### 6. 生词本增强
- 当前生词本功能较简单，只有列表展示
- 建议：支持分组/标签、导出为 Anki 格式、间隔复习提醒

#### 7. 多设备同步状态
- 云端同步没有冲突检测，后写覆盖
- 建议：增加时间戳对比，合并冲突时提示用户选择

#### 8. 单词发音优化
- 当前用 Web Speech API，发音质量一般
- 建议：接入有道/百度发音 API，支持英式/美式切换

### 低优先级

#### 9. 社区功能
- 用户互相出题、排行榜、学习打卡分享
- 可以用 Firebase Realtime Database 或 Cloudflare D1

#### 10. AI 对话练习
- 用 DeepSeek API 做英语口语对话练习
- AI 扮演考官，模拟 CET-4 口语考试

#### 11. 离线支持
- 加 Service Worker 缓存，支持完全离线使用
- vocab.json 已有 1MB，离线缓存后可断网背词

#### 12. 性能优化
- vocab.json 按需加载（当前一次性加载 1MB）
- 热力图 DOM 节点较多，可考虑虚拟滚动

#### 13. 无障碍优化
- 键盘快捷键（空格翻牌、1/2/3 选择掌握程度）
- 屏幕阅读器支持

#### 14. 国际化
- 界面当前为中文，可考虑中英双语切换
- 对英语学习者来说，英文界面也是一种沉浸

---

## 已知问题

- `updatedAt` timestamp 解析未实现（parseValue 缺 timestampValue 处理）
- 热力图首次加载无历史数据，全灰不太好看，可加个引导提示
- Live2D 看板娘偶尔加载失败，缺少 fallback
- DeepSeek API Key 明文存在 localStorage，有安全风险
- 卡片背景自定义图片存为 base64，大图可能撑爆 localStorage（虽然已裁剪压缩）

---

## 数据指标

- 词汇量：4544 词（核心词 1162，四级词 2382，补充词 1000）
- 有 BNC 词频数据的词：4504 / 4544
- 文件大小：index.html ~170KB，vocab.json ~1MB
- 云同步：Firebase Firestore 免费额度 1GB 存储 / 50K 读 / 20K 写每天
- Cloudflare Worker：免费 100K 请求/天

---

*最后更新：2026-05-04*
