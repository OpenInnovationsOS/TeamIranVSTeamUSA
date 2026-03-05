# 🔫 Weapon System Documentation

## Overview

The Team Iran vs USA game features a comprehensive weapon system with animations, boost packs, and monetization integration. This document provides complete technical specifications and implementation details.

---

## 🎯 System Features

### Core Components
- **100 Unique Weapons**: Balanced Iran vs USA arsenal
- **Weapon Categories**: Pistols, Rifles, Snipers, Shotguns, SMGs, LMGs, Explosives, Melee, Special
- **Rarity System**: Common, Uncommon, Rare, Epic, Legendary
- **Animation System**: Bottom-to-top animations with particle effects
- **Boost System**: 10 different boost pack types
- **Monetization**: STG token integration with TON blockchain
- **Inventory Management**: User weapon and boost tracking

---

## 🗄️ Database Schema

### Weapon Model
```javascript
{
  weapon_id: String,           // Unique identifier
  name: String,               // Display name
  category: String,            // pistol, rifle, sniper, etc.
  faction: String,             // iran, usa, neutral
  rarity: String,              // common, uncommon, rare, epic, legendary
  base_stats: {
    damage: Number,             // 1-1000
    accuracy: Number,           // 0-100
    fire_rate: Number,          // 1-1000
    range: Number,              // 1-500
    reload_speed: Number,        // 0.1-10
    magazine_size: Number        // 1-200
  },
  unlock_requirements: {
    level: Number,              // 1-100
    experience: Number,          // 0+
    stg_tokens: Number,         // 0+
    achievements: [String]        // Achievement IDs
  },
  visual_effects: {
    animation_type: String,       // slide_up, fade_in, rotate_360, bounce, glow, particle_burst
    animation_duration: Number,  // 0.1-3.0 seconds
    color_scheme: String,        // bronze, silver, gold, blue, red, green, purple, rainbow
    particle_effects: [{
      type: String,             // flash, smoke, glow, trail, spark
      intensity: Number          // 1-10
    }]
  },
  boost_info: {
    can_be_boosted: Boolean,     // Whether weapon can be boosted
    max_boost_level: Number,     // 1-10
    boost_multipliers: {
      damage: Number,            // 1.0-3.0
      accuracy: Number,          // 1.0-2.0
      fire_rate: Number          // 1.0-2.5
    }
  },
  pricing: {
    base_price: Number,          // STG tokens
    currency: String,             // STG, USD
    discount_tiers: [{
      quantity: Number,           // Bulk purchase quantity
      discount_percent: Number     // 0-100
    }]
  },
  availability: {
    is_active: Boolean,          // Currently available
    is_limited: Boolean,         // Limited quantity
    limited_quantity: Number,     // Max available
    start_date: Date,           // Sale start
    end_date: Date             // Sale end
  }
}
```

### Weapon Boost Model
```javascript
{
  boost_id: String,             // Unique boost identifier
  user_id: ObjectId,           // User reference
  weapon_id: String,           // Weapon being boosted
  boost_level: Number,          // 1-10
  boost_type: String,           // damage, accuracy, fire_rate, all_stats, special_ability
  duration_hours: Number,        // 1-720 hours
  boost_multiplier: Number,       // 1.0-3.0
  cost: {
    stg_tokens: Number,         // Cost in STG tokens
    usd_equivalent: Number      // Cost in USD
  },
  status: String,               // active, expired, used, pending
  activation_time: Date,         // When boost was activated
  expiry_time: Date,           // When boost expires
  purchase_details: {
    transaction_id: String,       // Transaction ID
    payment_method: String,       // stg_tokens, ton, stripe, coinbase
    wallet_address: String,      // TON wallet address
    blockchain_tx_hash: String    // Blockchain transaction
  },
  effects: {
    visual_effects: [{
      type: String,             // glow, particle_trail, color_change, aura, lightning
      intensity: Number,         // 1-10
      color: String              // Color of effect
    }],
    special_abilities: [{
      name: String,             // Ability name
      description: String,        // Ability description
      cooldown_seconds: Number,   // 1-300 seconds
      duration_seconds: Number     // 1-60 seconds
    }]
  }
}
```

---

## 🔫 Weapon Arsenal (100 Weapons)

### Iran Weapons (50)
#### Pistols (2)
1. **Zulfikar** - Standard Iranian sidearm
2. **Fateh** - High-capacity Iranian pistol

#### Rifles (2)
3. **KH-2002** - Balanced Iranian assault rifle
4. **Sayyad** - Premium Iranian rifle

#### Snipers (1)
5. **Taj** - Iranian sniper rifle

#### Shotguns (1)
6. **Mojtama** - Iranian combat shotgun

#### SMGs (1)
7. **Kolt** - Compact Iranian submachine gun

#### LMGs (1)
8. **PKM** - Russian-Iranian general purpose machine gun

#### Explosives (1)
9. **RGD-5** - Iranian fragmentation grenade

#### Melee (1)
10. **Khanjar** - Traditional Iranian combat knife

#### Special (1)
11. **Zulfiqar** - Experimental Iranian energy weapon

### USA Weapons (50)
#### Pistols (2)
1. **M1911** - Classic American sidearm
2. **Glock 19** - Modern American pistol

#### Rifles (2)
3. **M4A1** - Standard American assault rifle
4. **SCAR-H** - Advanced American battle rifle

#### Snipers (1)
5. **Barrett M82** - American anti-materiel sniper rifle

#### Shotguns (1)
6. **Benelli M4** - Italian-American tactical shotgun

#### SMGs (1)
7. **MP5** - German-American submachine gun

#### LMGs (1)
8. **M240** - American general purpose machine gun

#### Explosives (1)
9. **M67** - American fragmentation grenade

#### Melee (1)
10. **Ka-Bar** - American combat knife

#### Special (1)
11. **ADS** - American directed energy weapon

---

## 🎬 Animation System

### Animation Types
1. **slide_up** - Weapon slides up from bottom
2. **fade_in** - Weapon fades in at position
3. **rotate_360** - Weapon rotates 360 degrees
4. **bounce** - Weapon bounces into position
5. **glow** - Weapon glows with color effect
6. **particle_burst** - Particle explosion effect

### Color Schemes
- **Bronze**: Common weapons
- **Silver**: Uncommon weapons
- **Gold**: Rare weapons
- **Blue**: Epic weapons
- **Red**: Legendary weapons
- **Green/Purple**: Special weapons
- **Rainbow**: Ultimate weapons

### Particle Effects
- **Flash**: Muzzle flash effect
- **Smoke**: Smoke trail effect
- **Glow**: Weapon glow effect
- **Trail**: Particle trail effect
- **Spark**: Spark particles
- **Particle Burst**: Explosion effect
- **Lightning**: Electric effect

### Animation Durations
- **Common**: 0.3-0.5 seconds
- **Uncommon**: 0.5-0.7 seconds
- **Rare**: 0.7-1.0 seconds
- **Epic**: 1.0-1.5 seconds
- **Legendary**: 1.5-2.0 seconds
- **Special**: 2.0-2.2 seconds

---

## ⚡ Weapon Boost Packs

### Damage Boosts
1. **Damage Boost Pack - Basic**
   - +20% damage for 24 hours
   - Cost: 50 STG tokens

2. **Damage Boost Pack - Advanced**
   - +50% damage for 24 hours
   - Cost: 120 STG tokens

### Accuracy Boosts
3. **Accuracy Boost Pack - Basic**
   - +15% accuracy for 24 hours
   - Cost: 40 STG tokens

4. **Accuracy Boost Pack - Advanced**
   - +30% accuracy for 24 hours
   - Cost: 90 STG tokens

### Fire Rate Boosts
5. **Fire Rate Boost Pack - Basic**
   - +25% fire rate for 24 hours
   - Cost: 60 STG tokens

6. **Fire Rate Boost Pack - Advanced**
   - +50% fire rate for 24 hours
   - Cost: 140 STG tokens

### All Stats Boosts
7. **All Stats Boost Pack - Basic**
   - +15% all stats for 24 hours
   - Cost: 150 STG tokens

8. **All Stats Boost Pack - Advanced**
   - +35% all stats for 24 hours
   - Cost: 300 STG tokens

### Special Packs
9. **Weekend Warrior Pack**
   - +50% all stats for 48 hours
   - Cost: 500 STG tokens
   - Limited availability

10. **Tournament Champion Pack**
   - +75% all stats for 72 hours
   - Cost: 1000 STG tokens
   - Limited availability

---

## 🌐 API Endpoints

### Weapon Management
```
GET    /api/weapons                    // Get all weapons with filters
GET    /api/weapons/boost-packs          // Get boost packs
GET    /api/weapons/:weaponId           // Get specific weapon
POST   /api/weapons/purchase             // Purchase weapon
POST   /api/weapons/boost-purchase        // Purchase boost
GET    /api/weapons/user-inventory       // Get user weapons
GET    /api/weapons/boost-history        // Get boost history
```

### Query Parameters
```
category: pistol|rifle|sniper|shotgun|smg|lmg|explosive|melee|special
faction: iran|usa
rarity: common|uncommon|rare|epic|legendary
min_level: 1-100
max_price: 1-50000
search: text search
page: pagination
limit: items per page (default: 20)
```

### Response Examples
```javascript
// Get Weapons Response
{
  "success": true,
  "data": {
    "weapons": [{
      "weapon_id": "ir_pistol_01",
      "display_name": "⚪ Zulfikar",
      "name": "Zulfikar",
      "category": "pistol",
      "faction": "iran",
      "rarity": "common",
      "base_stats": {
        "damage": 25,
        "accuracy": 85,
        "fire_rate": 180,
        "range": 50,
        "reload_speed": 2.0,
        "magazine_size": 12
      },
      "unlock_requirements": {
        "level": 1,
        "experience": 0,
        "stg_tokens": 0,
        "achievements": []
      },
      "visual_effects": {
        "animation_type": "slide_up",
        "animation_duration": 0.5,
        "color_scheme": "bronze",
        "particle_effects": [
          { "type": "flash", "intensity": 3 },
          { "type": "smoke", "intensity": 2 }
        ]
      },
      "boost_info": {
        "can_be_boosted": true,
        "max_boost_level": 5,
        "boost_multipliers": {
          "damage": 1.2,
          "accuracy": 1.1,
          "fire_rate": 1.15
        }
      },
      "total_power": 2125,
      "can_be_boosted": true,
      "animation_config": {
        "type": "slide_up",
        "duration": 0.5,
        "color_scheme": "bronze",
        "particle_effects": [
          { "type": "flash", "intensity": 3 },
          { "type": "smoke", "intensity": 2 }
        ]
      }
    }],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_items": 100,
      "items_per_page": 20
    }
  }
}
```

---

## 💰 Monetization Integration

### TON Wallet Integration
- **STG_TOKENS_WALLET**: Receives all weapon purchases
- **PREMIUM_FEATURES_WALLET**: Receives all weapon boost purchases
- **Blockchain Integration**: Transaction hash tracking
- **Currency Conversion**: STG tokens to USD equivalent (1 STG = $0.01)

### Payment Categories
- **WEAPON_PURCHASES**: Direct weapon buying
- **WEAPON_BOOSTS**: Weapon enhancement packs
- **DISCOUNT_TIERS**: Bulk purchase discounts
- **LIMITED_EDITIONS**: Time-limited special offers

---

## 🎮 Frontend Integration

### Weapon Selection Flow
1. **Browse Weapons**: Filter by category, faction, rarity
2. **View Details**: See stats, requirements, animations
3. **Purchase Weapons**: Use STG tokens or TON
4. **Activate Boosts**: Apply temporary enhancements
5. **Manage Inventory**: View owned weapons and active boosts

### Animation Implementation
```javascript
// Weapon Tap Animation
function onWeaponTap(weaponId) {
  const weapon = getWeapon(weaponId);
  
  // Play animation based on weapon rarity
  playAnimation({
    type: weapon.visual_effects.animation_type,
    duration: weapon.visual_effects.animation_duration,
    color_scheme: weapon.visual_effects.color_scheme,
    particle_effects: weapon.visual_effects.particle_effects
  });
  
  // Move weapon from bottom to top of screen
  animateWeaponPosition('bottom', 'top', {
    duration: weapon.visual_effects.animation_duration,
    easing: 'ease-out'
  });
  
  // Show particle effects
  showParticleEffects(weapon.visual_effects.particle_effects);
}
```

### Boost Activation Effects
```javascript
// Boost Activation Animation
function activateBoost(boostId) {
  const boost = getWeaponBoost(boostId);
  
  // Apply visual effects
  showBoostEffects({
    type: 'glow',
    color: boost.boost_level > 2 ? 'gold' : 'blue',
    intensity: 5 + boost.boost_level,
    duration: 2000
  });
  
  // Update weapon stats in real-time
  updateWeaponStats(boost.weapon_id, boost.getBoostedStats());
  
  // Show boost timer
  startBoostTimer(boost.duration_hours);
}
```

---

## 📊 Analytics & Tracking

### Weapon Usage Analytics
- **Purchase History**: Track all weapon acquisitions
- **Boost Usage**: Monitor boost activation and expiry
- **Popular Weapons**: Most purchased/used weapons
- **Revenue Tracking**: STG token and USD revenue
- **User Engagement**: Weapon usage patterns

### Performance Metrics
- **Weapon Balance**: Ensure faction balance
- **Rarity Distribution**: Monitor availability
- **Boost Effectiveness**: Track boost usage vs. performance
- **Conversion Rates**: Purchase completion rates

---

## 🔧 Development Setup

### Database Setup
```bash
# Seed weapons
cd backend && node scripts/seed-weapons.js

# Start backend
cd backend && npm start
```

### Environment Variables
```env
MONGODB_URI=mongodb://localhost:27017/team-iran-vs-usa
STG_TOKENS_WALLET=0:your_stg_tokens_wallet_address_here
PREMIUM_FEATURES_WALLET=0:your_premium_features_wallet_address_here
JWT_SECRET=your_jwt_secret_key_here
```

### API Testing
```bash
# Test weapon endpoints
curl http://localhost:3001/api/weapons
curl http://localhost:3001/api/weapons/boost-packs
curl http://localhost:3001/api/weapons/ir_pistol_01
```

---

## 🚀 Production Deployment

### Railway Configuration
```toml
[build]
builder = "NIXPACKS"

[env]
NODE_ENV = "production"
MONGODB_URI = "${{MONGODB_URI}}"
STG_TOKENS_WALLET = "${{STG_TOKENS_WALLET}}"
PREMIUM_FEATURES_WALLET = "${{PREMIUM_FEATURES_WALLET}}"
JWT_SECRET = "${{JWT_SECRET}}"
```

### Scaling Considerations
- **Database Indexes**: Optimize for weapon queries
- **Caching**: Cache popular weapons data
- **CDN**: Serve weapon assets via CDN
- **Rate Limiting**: Protect against abuse
- **Monitoring**: Track API performance

---

## 🎯 Game Balance

### Weapon Power Scaling
- **Common**: Base power 100-300
- **Uncommon**: Base power 200-500
- **Rare**: Base power 400-800
- **Epic**: Base power 600-1200
- **Legendary**: Base power 800-2000

### Unlock Progression
- **Level 1-10**: Basic weapons unlocked
- **Level 11-20**: Advanced weapons available
- **Level 21-50**: Elite weapons accessible
- **Achievements**: Special weapon unlocks

### Boost Balance
- **Basic Boosts**: +15-25% stat increase
- **Advanced Boosts**: +30-50% stat increase
- **Duration**: 24-72 hours based on pack
- **Cost**: Scales with boost level and duration

---

## 🔒 Security Considerations

### Payment Security
- **TON Blockchain**: Immutable transaction records
- **Wallet Validation**: Verify TON wallet addresses
- **Double Spending Prevention**: Server-side validation
- **Transaction Limits**: Prevent rapid abuse

### Data Protection
- **User Privacy**: Encrypt sensitive data
- **Rate Limiting**: API protection
- **Input Validation**: Joi schema validation
- **SQL Injection Prevention**: Mongoose sanitization

---

## 📈 Future Enhancements

### Planned Features
1. **Weapon Customization**: Skins and attachments
2. **Tournament Integration**: Special tournament weapons
3. **Trading System**: Player-to-player weapon trading
4. **Crafting System**: Create weapons from parts
5. **Leaderboards**: Weapon-based rankings
6. **Achievement System**: Weapon-specific achievements

### Technical Improvements
1. **Real-time Sync**: WebSocket for live updates
2. **Mobile Optimization**: Touch-friendly interfaces
3. **Offline Support**: Cache weapons for offline play
4. **Performance**: Optimize for low-end devices
5. **Analytics**: Advanced usage analytics

---

## 📞 Support & Troubleshooting

### Common Issues
1. **Animation Not Playing**: Check browser compatibility
2. **Boost Not Activating**: Verify payment completion
3. **Weapon Not Unlocking**: Check requirements
4. **Payment Failed**: Verify TON wallet balance

### Debug Tools
- **Browser Console**: Check for JavaScript errors
- **Network Tab**: Monitor API calls
- **Backend Logs**: Check server error logs
- **Database Logs**: Verify MongoDB operations

---

## 🎉 Conclusion

The weapon system provides a comprehensive foundation for the Team Iran vs USA game with:

- **100 Unique Weapons**: Balanced and diverse arsenal
- **Advanced Animations**: Smooth visual feedback
- **Flexible Boost System**: Multiple enhancement options
- **Monetization Ready**: TON blockchain integration
- **Scalable Architecture**: Built for growth and expansion

This system creates engaging gameplay with progression, customization, and competitive balance while supporting sustainable monetization through blockchain technology.
