# Team Iran vs Team USA - Telegram Mini-Game/P2E

A Telegram Mini-Game with Play-to-Earn mechanics where players choose between Team Iran and Team USA factions and compete in various challenges.

## 🎮 Game Features

- **Faction Selection**: Choose between Team Iran or Team USA
- **Tap-to-Earn**: Simple tap mechanics to earn STG tokens
- **PvP Battles**: Head-to-head battles with STG wagers
- **Territory Control**: Global map with faction influence
- **Daily Missions**: Quests and challenges for rewards
- **Leaderboards**: Global and faction-specific rankings
- **Referral System**: Viral growth mechanics
- **WIN Token**: Native cryptocurrency with 1 trillion supply

## 💰 Token System

### Three-Currency Model

1. **TON**: External payment currency for premium features
2. **STG (Strategy Token)**: Off-chain in-game currency earned through gameplay
3. **WIN Token**: On-chain native token (1 trillion supply) for rewards and staking

## 🛠 Tech Stack

### Backend
- Node.js with Express
- PostgreSQL for data storage
- Redis for rate limiting and caching
- Telegram Bot API integration
- TON blockchain integration

### Frontend
- React with Telegram WebApp SDK
- TON Connect for wallet integration
- Responsive design for mobile

### Blockchain
- TON (Telegram Open Network)
- Smart contracts for WIN token
- Treasury contract for TON payments

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- PostgreSQL
- Redis
- Telegram Bot Token
- TON API credentials

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd team-iran-vs-usa-telegram-game
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up database
```bash
npm run migrate
npm run seed
```

5. Start the server
```bash
npm run dev
```

## 📁 Project Structure

```
├── src/
│   ├── server.js              # Main server file
│   ├── controllers/           # API controllers
│   ├── models/               # Database models
│   ├── services/             # Business logic
│   ├── middleware/           # Express middleware
│   ├── routes/               # API routes
│   ├── database/             # Database setup and migrations
│   ├── telegram/             # Telegram bot logic
│   ├── blockchain/           # TON integration
│   └── utils/                # Utility functions
├── frontend/                 # React frontend
├── contracts/                # Smart contracts
├── docs/                    # Documentation
└── scripts/                 # Utility scripts
```

## 🎯 Game Mechanics

### Tap-to-Earn
- Players tap to earn STG tokens
- Rate limited to prevent abuse
- Rewards scale with player level

### PvP Battles
- Players wager STG tokens
- Winner takes all
- Faction bonuses apply

### Territory Control
- Global map divided into territories
- Factions compete for control
- Collective effort determines influence

### Daily Missions
- New challenges every day
- Varying difficulty levels
- Bonus rewards for completion

## 🔐 Security Features

- Rate limiting with Redis
- Anti-cheat mechanisms
- Secure JWT authentication
- Multisig treasury protection
- Smart contract audits

## 📈 Scalability

- Horizontal scaling support
- Database read replicas
- Redis clustering
- CDN for static assets
- Load balancing ready

## ⚠️ Legal & Ethical Considerations

- Fictionalized conflict theme
- Compliance with Telegram ToS
- Regulatory compliance for tokens
- No guaranteed financial returns
- Responsible gaming practices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Join our Telegram community
- Check the documentation in `/docs`

---

⚠️ **Disclaimer**: This is a game for entertainment purposes. No real-world political conflict is intended. Please play responsibly.
