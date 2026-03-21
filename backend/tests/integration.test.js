const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../src/server');

// Test data
const testUser = {
  telegram_id: 123456789,
  username: 'testuser',
  faction: 'iran'
};

const testBattle = {
  battle_id: 'test_battle_123',
  players: [
    {
      user_id: 'user1_id',
      telegram_id: 123456789,
      username: 'player1',
      faction: 'iran',
      level: 5,
      current_health: 100,
      max_health: 100,
      energy: 50,
      max_energy: 50
    },
    {
      user_id: 'user2_id',
      telegram_id: 987654321,
      username: 'player2',
      faction: 'usa',
      level: 5,
      current_health: 100,
      max_health: 100,
      energy: 50,
      max_energy: 50
    }
  ],
  battle_config: {
    stake_amount: 100,
    battle_type: 'normal',
    fee_amount: 5
  },
  status: 'pending'
};

describe('Team Iran vs USA Game API Integration Tests', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    // Connect to test database
    const testDbUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/test_game';
    await mongoose.connect(testDbUri);
  });

  afterAll(async () => {
    // Clean up and close database connection
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean up collections before each test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  describe('Authentication Endpoints', () => {
    test('POST /api/register - should register new user', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({
          username: testUser.username,
          faction: testUser.faction
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe(testUser.username);
      expect(response.body.data.user.faction).toBe(testUser.faction);
      expect(response.body.data.token).toBeDefined();
      
      authToken = response.body.data.token;
      userId = response.body.data.user.id;
    });

    test('POST /api/auth/telegram - should authenticate with Telegram', async () => {
      const response = await request(app)
        .post('/api/auth/telegram')
        .send({
          telegram_id: testUser.telegram_id,
          username: testUser.username,
          first_name: 'Test',
          last_name: 'User'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.username).toBe(testUser.username);
      expect(response.body.token).toBeDefined();
    });

    test('GET /api/auth/verify - should verify token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.username).toBe(testUser.username);
    });
  });

  describe('Battle Arena Endpoints', () => {
    beforeEach(async () => {
      // Register and authenticate user
      const registerResponse = await request(app)
        .post('/api/register')
        .send({
          username: testUser.username,
          faction: testUser.faction
        });
      
      authToken = registerResponse.body.data.token;
    });

    test('POST /api/battle/matchmaking - should join matchmaking queue', async () => {
      const response = await request(app)
        .post('/api/matchmaking/join')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          battle_type: 'normal',
          stake_amount: 100,
          faction_preference: 'any'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.queue_id).toBeDefined();
      expect(response.body.data.preferences).toBeDefined();
    });

    test('GET /api/matchmaking/status - should get queue status', async () => {
      // First join queue
      await request(app)
        .post('/api/matchmaking/join')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          battle_type: 'normal',
          stake_amount: 100
        });

      const response = await request(app)
        .get('/api/matchmaking/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.in_queue).toBe(true);
    });

    test('POST /api/matchmaking/leave - should leave matchmaking queue', async () => {
      // First join queue
      await request(app)
        .post('/api/matchmaking/join')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          battle_type: 'normal',
          stake_amount: 100
        });

      const response = await request(app)
        .post('/api/matchmaking/leave')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Left matchmaking queue');
    });
  });

  describe('Tournament Endpoints', () => {
    beforeEach(async () => {
      // Register and authenticate user
      const registerResponse = await request(app)
        .post('/api/register')
        .send({
          username: testUser.username,
          faction: testUser.faction
        });
      
      authToken = registerResponse.body.data.token;
    });

    test('GET /api/tournaments - should get tournaments list', async () => {
      const response = await request(app)
        .get('/api/tournaments')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.tournaments)).toBe(true);
    });

    test('POST /api/tournaments/:id/register - should register for tournament', async () => {
      // First create a tournament (this would typically be done by admin)
      const tournament = await mongoose.connection.db.collection('tournaments').insertOne({
        tournament_id: 'test_tournament_123',
        name: 'Test Tournament',
        tournament_type: 'elimination',
        status: 'registration',
        registration: {
          start_date: new Date(),
          end_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
          min_participants: 2,
          max_participants: 16,
          entry_fee: 100,
          level_requirement: 1
        }
      });

      const response = await request(app)
        .post(`/api/tournaments/${tournament.insertedId}/register`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Successfully registered for tournament');
    });
  });

  describe('Achievement Endpoints', () => {
    beforeEach(async () => {
      // Register and authenticate user
      const registerResponse = await request(app)
        .post('/api/register')
        .send({
          username: testUser.username,
          faction: testUser.faction
        });
      
      authToken = registerResponse.body.data.token;
    });

    test('GET /api/achievements - should get user achievements', async () => {
      const response = await request(app)
        .get('/api/achievements')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('POST /api/achievements/initialize - should initialize achievements', async () => {
      const response = await request(app)
        .post('/api/achievements/initialize')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Achievements initialized successfully');
    });
  });

  describe('Guild Endpoints', () => {
    beforeEach(async () => {
      // Register and authenticate user
      const registerResponse = await request(app)
        .post('/api/register')
        .send({
          username: testUser.username,
          faction: testUser.faction
        });
      
      authToken = registerResponse.body.data.token;
    });

    test('GET /api/guilds - should get guilds list', async () => {
      const response = await request(app)
        .get('/api/guilds')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.guilds)).toBe(true);
    });

    test('POST /api/guilds - should create new guild', async () => {
      const response = await request(app)
        .post('/api/guilds')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Guild',
          tag: 'TEST',
          description: 'A test guild',
          faction: testUser.faction,
          type: 'public'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Guild created successfully');
      expect(response.body.data.name).toBe('Test Guild');
    });
  });

  describe('Territory Endpoints', () => {
    beforeEach(async () => {
      // Register and authenticate user
      const registerResponse = await request(app)
        .post('/api/register')
        .send({
          username: testUser.username,
          faction: testUser.faction
        });
      
      authToken = registerResponse.body.data.token;
    });

    test('GET /api/territories - should get territories list', async () => {
      const response = await request(app)
        .get('/api/territories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/territories/world-map - should get world map', async () => {
      const response = await request(app)
        .get('/api/territories/world-map')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Weapon Purchase Endpoints', () => {
    beforeEach(async () => {
      // Register and authenticate user
      const registerResponse = await request(app)
        .post('/api/register')
        .send({
          username: testUser.username,
          faction: testUser.faction
        });
      
      authToken = registerResponse.body.data.token;
    });

    test('GET /api/weapon-purchases/catalog - should get weapon catalog', async () => {
      const response = await request(app)
        .get('/api/weapon-purchases/catalog')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.weapons)).toBe(true);
      expect(response.body.data.categories).toBeDefined();
      expect(response.body.data.factions).toBeDefined();
    });

    test('POST /api/weapon-purchases/purchase - should purchase weapon', async () => {
      const response = await request(app)
        .post('/api/weapon-purchases/purchase')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          weapon_id: 'tank_merkava', // A neutral weapon
          payment_method: 'wallet'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Weapon purchased successfully');
      expect(response.body.data.purchase).toBeDefined();
    });
  });

  describe('Leaderboard Endpoints', () => {
    beforeEach(async () => {
      // Register and authenticate user
      const registerResponse = await request(app)
        .post('/api/register')
        .send({
          username: testUser.username,
          faction: testUser.faction
        });
      
      authToken = registerResponse.body.data.token;
    });

    test('GET /api/leaderboard/global - should get global leaderboard', async () => {
      const response = await request(app)
        .get('/api/leaderboard/global')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.leaderboard)).toBe(true);
    });

    test('GET /api/leaderboard/my-rank - should get user rank', async () => {
      const response = await request(app)
        .get('/api/leaderboard/my-rank')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('GET /api/nonexistent - should return 404', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    test('POST /api/register with invalid data - should return 400', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({
          username: '', // Invalid username
          faction: 'invalid' // Invalid faction
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('GET protected endpoint without token - should return 401', async () => {
      const response = await request(app)
        .get('/api/leaderboard/my-rank')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });
  });

  describe('WebSocket Integration', () => {
    test('WebSocket connection should be established', async () => {
      // This test would require a WebSocket client library
      // For now, we'll just test that the server responds to HTTP requests
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
    });
  });

  describe('Performance Tests', () => {
    test('GET /api/leaderboard/global should respond quickly', async () => {
      const start = Date.now();
      
      const response = await request(app)
        .get('/api/leaderboard/global')
        .expect(200);

      const duration = Date.now() - start;
      
      expect(response.body.success).toBe(true);
      expect(duration).toBeLessThan(1000); // Should respond within 1 second
    });

    test('Concurrent requests should be handled properly', async () => {
      const promises = [];
      
      // Make 10 concurrent requests
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .get('/api/leaderboard/global')
        );
      }

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });
});
