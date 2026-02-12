# EasyA Robin Bot - Chrome Extension

AI Agent Ability Token Marketplace - Trading bot powered by tokenized skills on Robin pump.fun.

## Project Structure

```
├── src/
│   ├── components/     # Layout, Tab Bar
│   ├── pages/          # Home, Shop, Agent, Profile, SkillDetail
│   ├── App.tsx
│   └── main.tsx
├── manifest.json       # Chrome Extension Manifest V3
└── vite.config.ts      # Vite + CRXJS
```

## Development

```bash
# Install dependencies
npm install

# Development mode (watch mode build)
npm run dev

# Production build
npm run build
```

## Load into Chrome

1. Run `npm run build`
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `dist` folder from the project

## Pages

- **Home** - Robot display with 4 skill slots
- **Shop** - Agent Skill Marketplace list
- **Shop/:id** - Skill details (includes Agent Prompt)
- **Agent** - Zero UI with glowing text showing bot status, confirmation buttons when needed
- **Profile** - Total assets, balance chart, token holdings list

## Tab Bar

Fixed bottom navigation: Home | Shop | Agent | Profile
