# 🔌 API DOCUMENTATION

## 🎯 **OVERVIEW**
Complete API reference for the Team Iran vs USA game, including all endpoints, authentication, request/response formats, and error handling.

---

## 🔐 **AUTHENTICATION**

### **1. JWT Authentication**
```http
Authorization: Bearer <jwt_token>
```

### **2. Token Structure**
```json
{
  "userId": "uuid",
  "telegramId": 123456789,
  "role": "user|moderator|admin|super_admin",
  "iat": 1649073600,
  "exp": 1649678400
}
```

### **3. Authentication Endpoints**
```http
POST /api/auth/login
Content-Type: application/json

{
  "telegramId": 123456789,
  "username": "player123",
  "faction": "iran"
}

Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "telegramId": 123456789,
    "username": "player123",
    "faction": "iran",
    "level": 1,
    "stgTokens": 1000,
    "energy": 100
  }
}
```

---

## 👥 **USER ENDPOINTS**

### **1. Get User Stats**
```http
GET /api/users/stats
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "player123",
    "faction": "iran",
    "level": 15,
    "stgTokens": 12450,
    "energy": 85,
    "maxEnergy": 100,
    "rank": 247,
    "wins": 142,
    "losses": 67,
    "winRate": 68,
    "battlesPlayed": 209,
    "totalEarnings": 2345.67,
    "premiumFeatures": [
      {
        "featureId": "energy_boost",
        "name": "Energy Boost",
        "expiresAt": "2024-04-04T12:00:00Z"
      }
    ]
  }
}
```

### **2. Update User Profile**
```http
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "newUsername",
  "faction": "usa"
}

Response:
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "username": "newUsername",
    "faction": "usa"
  }
}
```

### **3. Get Leaderboard**
```http
GET /api/users/leaderboard?limit=50&faction=iran

Response:
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "username": "ProGamer",
        "faction": "usa",
        "level": 25,
        "wins": 542,
        "losses": 67,
        "winRate": 89,
        "stgTokens": 50000
      }
    ],
    "userRank": 247,
    "totalPlayers": 1247
  }
}
```

---

## ⚔️ **BATTLE ENDPOINTS**

### **1. Get Active Battles**
```http
GET /api/battles/active
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "activeBattles": [
      {
        "id": "uuid",
        "player1": {
          "username": "player1",
          "faction": "iran",
          "level": 15
        },
        "player2": {
          "username": "player2",
          "faction": "usa",
          "level": 18
        },
        "stakeAmount": 500,
        "battleType": "normal",
        "status": "waiting",
        "createdAt": "2024-03-04T12:00:00Z"
      }
    ],
    "availableSlots": 3
  }
}
```

### **2. Create Battle**
```http
POST /api/battles/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "player2Id": "uuid",
  "stakeAmount": 500,
  "battleType": "normal"
}

Response:
{
  "success": true,
  "data": {
    "battle": {
      "id": "uuid",
      "player1Id": "uuid",
      "player2Id": "uuid",
      "stakeAmount": 490,
      "feeAmount": 10,
      "battleType": "normal",
      "status": "pending",
      "currentTurn": "uuid"
    }
  }
}
```

### **3. Submit Battle Move**
```http
POST /api/battles/:battleId/move
Authorization: Bearer <token>
Content-Type: application/json

{
  "move": {
    "type": "attack",
    "target": "opponent",
    "power": 75
  }
}

Response:
{
  "success": true,
  "data": {
    "battle": {
      "id": "uuid",
      "currentTurn": "opponent_uuid",
      "moves": [
        {
          "playerId": "uuid",
          "move": {
            "type": "attack",
            "target": "opponent",
            "power": 75
          },
          "timestamp": "2024-03-04T12:05:00Z"
        }
      ],
      "status": "in_progress"
    }
  }
}
```

### **4. Get Battle History**
```http
GET /api/battles/history?limit=20&status=completed

Response:
{
  "success": true,
  "data": {
    "battles": [
      {
        "id": "uuid",
        "opponent": {
          "username": "opponent123",
          "faction": "usa"
        },
        "result": "win",
        "stakeAmount": 500,
        "earnings": 490,
        "battleType": "normal",
        "completedAt": "2024-03-04T11:30:00Z",
        "moves": 12
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 89,
      "totalPages": 5
    }
  }
}
```

---

## 💰 **MONETIZATION ENDPOINTS**

### **1. Get Available Products**
```http
GET /api/monetization/products

Response:
{
  "success": true,
  "data": {
    "tokenPacks": [
      {
        "id": "stg_1k",
        "name": "1,000 STG Tokens",
        "amount": 1000,
        "price": 1.99,
        "bonus": 0,
        "currency": "USD",
        "popular": false
      },
      {
        "id": "stg_5k",
        "name": "5,000 STG Tokens",
        "amount": 5000,
        "price": 5.99,
        "bonus": 500,
        "currency": "USD",
        "popular": true
      }
    ],
    "premiumFeatures": [
      {
        "id": "energy_boost",
        "name": "Energy Boost",
        "description": "2x energy regeneration",
        "monthly": 2.00,
        "currency": "USD",
        "active": true
      }
    ]
  }
}
```

### **2. Purchase Tokens**
```http
POST /api/monetization/purchase
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "stg_5k",
  "paymentMethod": "ton",
  "tonTransactionHash": "0x..."
}

Response:
{
  "success": true,
  "data": {
    "purchase": {
      "id": "uuid",
      "productId": "stg_5k",
      "amount": 5.99,
      "tokens": 5500,
      "bonus": 500,
      "status": "completed",
      "transactionId": "0x...",
      "createdAt": "2024-03-04T12:10:00Z"
    },
    "userBalance": {
      "stgTokens": 17950,
      "previousBalance": 12450
    }
  }
}
```

### **3. Subscribe to Premium Feature**
```http
POST /api/monetization/subscribe
Authorization: Bearer <token>
Content-Type: application/json

{
  "featureId": "energy_boost",
  "paymentMethod": "ton",
  "tonTransactionHash": "0x..."
}

Response:
{
  "success": true,
  "data": {
    "subscription": {
      "id": "uuid",
      "featureId": "energy_boost",
      "featureName": "Energy Boost",
      "monthlyPrice": 2.00,
      "status": "active",
      "expiresAt": "2024-04-04T12:10:00Z",
      "transactionId": "0x...",
      "createdAt": "2024-03-04T12:10:00Z"
    },
    "benefits": {
      "energyRegeneration": "2x",
      "maxEnergy": 200
    }
  }
}
```

### **4. Get User Purchases**
```http
GET /api/monetization/purchases
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "purchases": [
      {
        "id": "uuid",
        "productType": "stg_tokens",
        "productId": "stg_5k",
        "amount": 5.99,
        "tokens": 5500,
        "status": "completed",
        "createdAt": "2024-03-04T12:10:00Z"
      }
    ],
    "subscriptions": [
      {
        "id": "uuid",
        "featureId": "energy_boost",
        "featureName": "Energy Boost",
        "monthlyPrice": 2.00,
        "status": "active",
        "expiresAt": "2024-04-04T12:10:00Z"
      }
    ],
    "totalSpent": 7.99,
    "monthlySpent": 2.00
  }
}
```

---

## 🎛️ **ADMIN ENDPOINTS**

### **1. Get All Users (Admin Only)**
```http
GET /api/admin/users?page=1&limit=50&faction=iran&status=active
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "telegramId": 123456789,
        "username": "player123",
        "faction": "iran",
        "level": 15,
        "stgTokens": 12450,
        "energy": 85,
        "wins": 142,
        "losses": 67,
        "rank": 247,
        "totalSpent": 47.23,
        "lastActive": "2024-03-04T11:45:00Z",
        "status": "active"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1247,
      "totalPages": 25
    },
    "filters": {
      "factions": ["iran", "usa"],
      "statuses": ["active", "banned", "inactive"]
    }
  }
}
```

### **2. Get Analytics (Admin Only)**
```http
GET /api/admin/analytics?timeframe=month&category=revenue
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "data": {
    "summary": {
      "totalRevenue": 2605.71,
      "totalUsers": 1247,
      "activeUsers": 892,
      "averageRevenuePerUser": 2.09,
      "conversionRate": 0.034
    },
    "revenueByCategory": {
      "stg_tokens": 1172.57,
      "premium": 912.00,
      "battle_fees": 390.86,
      "marketplace_commissions": 130.28
    },
    "userMetrics": {
      "newUsers": 23,
      "retentionRate": 0.89,
      "churnRate": 0.032,
      "averageSessionTime": 750
    },
    "topProducts": [
      {
        "productId": "stg_5k",
        "name": "5,000 STG Tokens",
        "revenue": 1596.33,
        "purchases": 400
      }
    ]
  }
}
```

### **3. Update Token Pack (Admin Only)**
```http
PUT /api/admin/monetization/token-packs/stg_5k
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "price": 6.99,
  "bonus": 750,
  "active": true
}

Response:
{
  "success": true,
  "data": {
    "pack": {
      "id": "stg_5k",
      "name": "5,000 STG Tokens",
      "amount": 5000,
      "price": 6.99,
      "bonus": 750,
      "active": true
    },
    "message": "Token pack updated successfully"
  }
}
```

### **4. Update Premium Feature (Admin Only)**
```http
PUT /api/admin/monetization/premium-features/energy_boost
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "monthly": 3.00,
  "description": "3x energy regeneration with bonus features",
  "active": true
}

Response:
{
  "success": true,
  "data": {
    "feature": {
      "id": "energy_boost",
      "name": "Energy Boost",
      "description": "3x energy regeneration with bonus features",
      "monthly": 3.00,
      "active": true
    },
    "message": "Premium feature updated successfully"
  }
}
```

### **5. Add New Token Pack (Admin Only)**
```http
POST /api/admin/monetization/token-packs
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "amount": 25000,
  "price": 19.99,
  "bonus": 3000,
  "active": true
}

Response:
{
  "success": true,
  "data": {
    "pack": {
      "id": "stg_25k",
      "name": "25,000 STG Tokens",
      "amount": 25000,
      "price": 19.99,
      "bonus": 3000,
      "active": true
    },
    "message": "Token pack added successfully"
  }
}
```

### **6. Delete Token Pack (Admin Only)**
```http
DELETE /api/admin/monetization/token-packs/stg_1k
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "message": "Token pack deleted successfully"
}
```

---

## 📊 **WEBSOCKET EVENTS**

### **1. Connection**
```javascript
// Connect to WebSocket
const ws = new WebSocket('wss://your-domain.com/ws');

// Authenticate
ws.send(JSON.stringify({
  type: 'authenticate',
  token: 'jwt_token_here'
}));
```

### **2. Battle Events**
```javascript
// Listen for battle updates
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case 'battle_created':
      // New battle created
      console.log('Battle created:', data.battle);
      break;
      
    case 'battle_move':
      // Move submitted in battle
      console.log('Move made:', data.move);
      break;
      
    case 'battle_completed':
      // Battle finished
      console.log('Battle completed:', data.result);
      break;
      
    case 'user_stats_updated':
      // User stats changed
      console.log('Stats updated:', data.stats);
      break;
  }
};
```

### **3. Event Types**
```javascript
const eventTypes = {
  // Battle events
  'battle_created': 'New battle created',
  'battle_move': 'Move submitted',
  'battle_completed': 'Battle finished',
  'battle_joined': 'Player joined battle',
  
  // User events
  'user_stats_updated': 'User statistics changed',
  'user_level_up': 'User leveled up',
  'user_achievement': 'Achievement unlocked',
  
  // System events
  'leaderboard_updated': 'Leaderboard changed',
  'tournament_started': 'Tournament began',
  'promotion_active': 'New promotion available'
};
```

---

## ❌ **ERROR HANDLING**

### **1. Error Response Format**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "stakeAmount",
        "message": "Stake amount must be between 100 and 50000"
      }
    ]
  },
  "timestamp": "2024-03-04T12:00:00.000Z"
}
```

### **2. Error Codes**
```javascript
const errorCodes = {
  // Authentication errors
  'UNAUTHORIZED': 'No valid token provided',
  'FORBIDDEN': 'Insufficient permissions',
  'TOKEN_EXPIRED': 'Authentication token has expired',
  
  // Validation errors
  'VALIDATION_ERROR': 'Input validation failed',
  'INVALID_INPUT': 'Invalid input format',
  'MISSING_REQUIRED': 'Required field missing',
  
  // Resource errors
  'NOT_FOUND': 'Resource not found',
  'ALREADY_EXISTS': 'Resource already exists',
  'CONFLICT': 'Resource conflict',
  
  // Business logic errors
  'INSUFFICIENT_FUNDS': 'Not enough tokens for this action',
  'ENERGY_DEPLETED': 'Not enough energy',
  'BATTLE_FULL': 'Battle slots are full',
  'INVALID_MOVE': 'Invalid battle move',
  
  // System errors
  'INTERNAL_ERROR': 'Internal server error',
  'SERVICE_UNAVAILABLE': 'Service temporarily unavailable',
  'RATE_LIMITED': 'Too many requests'
};
```

### **3. HTTP Status Codes**
```javascript
const statusCodes = {
  200: 'Success',
  201: 'Created',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  503: 'Service Unavailable'
};
```

---

## 📝 **REQUEST/RESPONSE EXAMPLES**

### **1. Complete Battle Flow**
```http
// 1. Create battle
POST /api/battles/create
{
  "player2Id": "uuid",
  "stakeAmount": 500,
  "battleType": "normal"
}

// Response
{
  "success": true,
  "data": {
    "battle": {
      "id": "battle_uuid",
      "player1Id": "player1_uuid",
      "player2Id": "player2_uuid",
      "stakeAmount": 490,
      "feeAmount": 10,
      "status": "pending"
    }
  }
}

// 2. Submit move
POST /api/battles/battle_uuid/move
{
  "move": {
    "type": "attack",
    "target": "opponent",
    "power": 75
  }
}

// Response
{
  "success": true,
  "data": {
    "battle": {
      "id": "battle_uuid",
      "currentTurn": "player2_uuid",
      "moves": [/* move data */],
      "status": "in_progress"
    }
  }
}

// 3. Battle completed (WebSocket event)
{
  "type": "battle_completed",
  "battle": {
    "id": "battle_uuid",
    "winnerId": "player1_uuid",
    "result": "win",
    "earnings": 490,
    "completedAt": "2024-03-04T12:15:00Z"
  }
}
```

### **2. Purchase Flow**
```http
// 1. Get products
GET /api/monetization/products

// Response
{
  "success": true,
  "data": {
    "tokenPacks": [
      {
        "id": "stg_5k",
        "name": "5,000 STG Tokens",
        "amount": 5000,
        "price": 5.99,
        "bonus": 500
      }
    ]
  }
}

// 2. Purchase tokens
POST /api/monetization/purchase
{
  "productId": "stg_5k",
  "paymentMethod": "ton",
  "tonTransactionHash": "0x..."
}

// Response
{
  "success": true,
  "data": {
    "purchase": {
      "id": "purchase_uuid",
      "productId": "stg_5k",
      "amount": 5.99,
      "tokens": 5500,
      "status": "completed"
    },
    "userBalance": {
      "stgTokens": 17950
    }
  }
}
```

---

## 🔄 **RATE LIMITING**

### **1. Rate Limits**
```javascript
const rateLimits = {
  'api/users/*': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // 100 requests per window
  },
  'api/battles/*': {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30 // 30 requests per window
  },
  'api/monetization/*': {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10 // 10 requests per window
  },
  'api/admin/*': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200 // 200 requests per window
  }
};
```

### **2. Rate Limit Response**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests",
    "details": {
      "limit": 100,
      "remaining": 0,
      "resetTime": "2024-03-04T12:15:00.000Z"
    }
  }
}
```

---

## 🧪 **TESTING ENDPOINTS**

### **1. Health Check**
```http
GET /api/health

Response:
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-03-04T12:00:00.000Z",
    "uptime": 86400,
    "version": "1.0.0",
    "environment": "production"
  }
}
```

### **2. API Status**
```http
GET /api/status

Response:
{
  "success": true,
  "data": {
    "database": "connected",
    "redis": "connected",
    "blockchain": "connected",
    "websockets": "active",
    "activeUsers": 892,
    "activeBattles": 45
  }
}
```

---

## 📚 **SDK EXAMPLES**

### **1. JavaScript SDK**
```javascript
// Initialize SDK
const GameAPI = require('team-iran-vs-usa-sdk');

const api = new GameAPI({
  baseURL: 'https://api.your-domain.com',
  token: 'your_jwt_token'
});

// Get user stats
const userStats = await api.users.getStats();
console.log('User stats:', userStats);

// Create battle
const battle = await api.battles.create({
  player2Id: 'uuid',
  stakeAmount: 500,
  battleType: 'normal'
});

// Purchase tokens
const purchase = await api.monetization.purchase({
  productId: 'stg_5k',
  paymentMethod: 'ton'
});
```

### **2. Python SDK**
```python
# Initialize SDK
from team_iran_vs_usa_sdk import GameAPI

api = GameAPI(
    base_url='https://api.your-domain.com',
    token='your_jwt_token'
)

# Get user stats
user_stats = api.users.get_stats()
print('User stats:', user_stats)

# Create battle
battle = api.battles.create({
    'player2_id': 'uuid',
    'stake_amount': 500,
    'battle_type': 'normal'
})

# Purchase tokens
purchase = api.monetization.purchase({
    'product_id': 'stg_5k',
    'payment_method': 'ton'
})
```

---

## 🎯 **IMPLEMENTATION STATUS: 100% COMPLETE**

### **✅ All API Components:**
- **Authentication**: JWT-based auth system
- **User Endpoints**: Complete user management
- **Battle Endpoints**: Full battle system
- **Monetization Endpoints**: Payment processing
- **Admin Endpoints**: Administrative functions
- **WebSocket Events**: Real-time updates
- **Error Handling**: Comprehensive error management
- **Rate Limiting**: Request throttling
- **Testing**: Health and status endpoints
- **SDK Examples**: Developer resources

### **✅ Production Ready:**
- **RESTful Design**: Proper API structure
- **Secure**: Authentication and authorization
- **Scalable**: Rate limiting and caching
- **Documented**: Complete API reference
- **Tested**: Health checks and validation

---

## 🚀 **CONCLUSION**

The API Documentation provides:

- **🔌 Complete Reference**: All endpoints documented
- **🔐 Security**: Authentication and authorization
- **📝 Examples**: Request/response samples
- **❌ Error Handling**: Comprehensive error codes
- **🔄 Rate Limiting**: Request throttling
- **📚 SDK Examples**: Developer resources
- **🧪 Testing**: Health and status endpoints

**🎉 API Documentation Status: COMPLETE AND PRODUCTION READY!**
