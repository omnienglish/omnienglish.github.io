# OmniEnglish CET-4 备考平台

## 项目概况
- **地址**: https://omnienglish.github.io
- **仓库**: https://github.com/omnienglish/omnienglish.github.io
- **架构**: 单 HTML 文件 (`index.html`, ~3500 行), 内联 CSS/JS, 无构建工具
- **数据**: `vocab.json` — 4544 个 CET-4 词汇, 字段: word, phonetic, def, priority(1/2/3), bnc, cet4, cet4zh, cs, cszh

## 技术栈
- 纯前端 vanilla JS (不用 Vue/React)
- Firebase (通过 Cloudflare Worker 代理, 国内可直连)
- Cloudflare Worker: `https://omnienglish-proxy.1548626763.workers.dev`
- Worker 代码: `cf-worker.js` — 代理 Firebase Auth + Firestore REST API
- Live2D 看板娘: stevenjoezhang/live2d-widget (CDN)

## 核心功能模块

### 1. 高频词汇墙 (vocab page)
- **设置面板**: 词库选择(核心词/四级/补充词/全部) + 学习词量输入
- **WordScheduler**: 间隔重复调度引擎, 忘记→+2, 模糊→+5, 已掌握→移出
- **renderVocabCardUI**: 纯函数, 返回卡片正面/背面 HTML
- **词频标签**: BNC 词频排名, 高频(≤3000)/中频(3001-8000)/低频(8001+)
- **词库切换**: 点击滤按钮直接切换, 自动退出当前学习会话

### 2. 例句单词弹出卡牌
- 例句中的英文单词可点击, 弹出小卡牌
- 卡牌显示: 单词、音标、释义、例句(不可点击防套娃)、词频标签
- 朗读按钮 + 加入生词本按钮
- 关闭: 右上角 X 或点击卡牌外部

### 3. 复习模式 (review page)
- ReviewScheduler: Object.create(WordScheduler), 独立实例
- 卡片式复习, 复用 renderVocabCardUI

### 4. 写作批改 (writing page)
- DeepSeek API 集成, API Key 存 localStorage

### 5. 句子分析 (sentence page) + CS 术语 (cs page)

### 6. 生词本 (notebook page)
- 数据: localStorage key `oe-notebook`

### 7. Dashboard
- 进度条: 仅显示词汇掌握百分比 (knownCount / totalVocab)
- 倒计时: CET-4 考试 2026-06-13

### 8. Live2D 看板娘
- 位置: 左下角, z-index: 99999 (在侧栏上方)
- 可拖拽, 通过 mousedown/mousemove/mouseup 实现
- Widget autoload.js 硬编码 drag:false, 需自己实现拖拽

## 数据同步架构
```
Store.set(key, val)
  → localStorage.setItem('oe-' + key, val)
  → saveToCloud(key, val)  // async, 通过 Worker 代理
      → POST Worker /doc → Firebase Firestore REST API
```
- Worker 用匿名 auth (signUp), uid 存在 idToken 中
- Firestore 文档路径: `/users/{uid}`
- Firestore 规则: `allow read, write: if request.auth != null`
- 属性名含连字符(如 daily-priority)需反引号包裹 updateMask

## 关键文件
| 文件 | 说明 |
|------|------|
| `index.html` | 唯一前端文件, ~3500 行 |
| `vocab.json` | 4544 CET-4 词, 按 priority+bnc 排序 |
| `cf-worker.js` | Cloudflare Worker, 代理 Firebase |

## 已知问题 / 待办
- ECDICT 数据已合并到 vocab.json (bnc 字段), ecdict.csv 可删除
- Firebase SDK script 标签已移除, 改用 Worker fetch
- `updatedAt` timestamp 解析未实现 (parseValue 缺 timestampValue 处理)
- 旧用户 localStorage 中 `omni-daily-queue` 格式可能不兼容, 已加自动迁移
