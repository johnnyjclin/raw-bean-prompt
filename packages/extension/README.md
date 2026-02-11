# EasyA Robin Bot - Chrome Extension

AI Agent Ability Token Marketplace - Trading bot powered by tokenized skills on Robin pump.fun.

## 專案結構

```
├── src/
│   ├── components/     # Layout, Tab Bar
│   ├── pages/          # Home, Shop, Agent, Profile, SkillDetail
│   ├── App.tsx
│   └── main.tsx
├── manifest.json       # Chrome Extension Manifest V3
└── vite.config.ts      # Vite + CRXJS
```

## 開發

```bash
# 安裝依賴
npm install

# 開發模式（watch 模式建置）
npm run dev

# 生產建置
npm run build
```

## 載入到 Chrome

1. 執行 `npm run build`
2. 打開 Chrome，前往 `chrome://extensions/`
3. 開啟「開發人員模式」
4. 點「載入未封裝項目」
5. 選擇專案底下的 `dist` 資料夾

## 頁面說明

- **Home** - 機器人展示、4 個 skill slot
- **Shop** - Agent Skill Market Place 列表
- **Shop/:id** - Skill 詳情（含 Agent Prompt）
- **Agent** - Zero UI，glowing text 顯示 bot 狀態，需確認時出現按鈕
- **Profile** - 總資產、餘額圖表、持有代幣列表

## Tab Bar

底部固定：Home | Shop | Agent | Profile
