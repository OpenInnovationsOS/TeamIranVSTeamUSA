import request from 'supertest';
import { expect } from 'chai';
import { createMockUser, createMockBattle } from '../setup';

// Import the app
const app = require('../../src/server-simple.js');

describe('API Integration Tests', () => {
  let authToken;
  let testUser;

  before(async () => {
    // Create test user and get auth token
    testUser = createMockUser();
    authToken = 'mock-test-token';
  });

  describe('Authentication Endpoints', () => {
    test('POST /api/auth/login - successful login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: 'testpassword'
        });

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('token');
      expect(response.body).to.have.property('user');
    });

    test('POST /api/auth/login - invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'invaliduser',
          password: 'invalidpass'
        });

      expect(response.status).to.equal(401);
      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('error');
    });

    test('GET /api/auth/verify - valid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-user-id', testUser.id);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('user');
    });

    test('GET /api/auth/verify - invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer invalid-token')
        .set('x-user-id', testUser.id);

      expect(response.status).to.equal(401);
      expect(response.body).to.have.property('success', false);
    });
  });

  describe('Battle Endpoints', () => {
    test('POST /api/battle - successful battle', async () => {
      const battleData = {
        opponent_id: 'test-opponent-123',
        wager: 100,
        weapon_id: 'basic_sword',
        territory_id: 'tehran'
      };

      const response = await request(app)
        .post('/api/battle')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-user-id', testUser.id)
        .send(battleData);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('result');
      expect(response.body).to.have.property('reward');
      expect(response.body).to.have.property('battle');
    });

    test('POST /api/battle - insufficient wager', async () => {
      const battleData = {
        opponent_id: 'test-opponent-123',
        wager: 50, // Below minimum
        weapon_id: 'basic_sword',
        territory_id: 'tehran'
      };

      const response = await request(app)
        .post('/api/battle')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-user-id', testUser.id)
        .send(battleData);

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('success', false);
      expect(response.body.error).to.include('Minimum wager');
    });

    test('POST /api/battle - missing opponent', async () => {
      const battleData = {
        wager: 100,
        weapon_id: 'basic_sword',
        territory_id: 'tehran'
      };

      const response = await request(app)
        .post('/api/battle')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-user-id', testUser.id)
        .send(battleData);

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('success', false);
      expect(response.body.error).to.include('opponent_id');
    });

    test('GET /api/battles/history - user battle history', async () => {
      const response = await request(app)
        .get('/api/battles/history')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-user-id', testUser.id);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('battles');
      expect(response.body.battles).to.be.an('array');
    });
  });

  describe('User Profile Endpoints', () => {
    test('GET /api/profile - user profile', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-user-id', testUser.id);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('profile');
      expect(response.body.profile).to.have.property('id', testUser.id);
      expect(response.body.profile).to.have.property('username', testUser.username);
    });

    test('PUT /api/profile - update profile', async () => {
      const updateData = {
        display_name: 'Updated Name',
        bio: 'Updated bio'
      };

      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-user-id', testUser.id)
        .send(updateData);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('profile');
      expect(response.body.profile.display_name).to.equal(updateData.display_name);
      expect(response.body.profile.bio).to.equal(updateData.bio);
    });

    test('GET /api/profile/stats - user statistics', async () => {
      const response = await request(app)
        .get('/api/profile/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-user-id', testUser.id);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('stats');
      expect(response.body.stats).to.have.property('wins');
      expect(response.body.stats).to.have.property('losses');
      expect(response.body.stats).to.have.property('battles_fought');
    });
  });

  describe('Territory Endpoints', () => {
    test('GET /api/territories - all territories', async () => {
      const response = await request(app)
        .get('/api/territories')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-user-id', testUser.id);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('territories');
      expect(response.body.territories).to.be.an('array');
      expect(response.body.territories.length).to.be.greaterThan(0);
    });

    test('GET /api/territories/:id - specific territory', async () => {
      const response = await request(app)
        .get('/api/territories/tehran')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-user-id', testUser.id);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('territory');
      expect(response.body.territory).to.have.property('id', 'tehran');
    });

    test('POST /api/territories/attack - attack territory', async () => {
      const attackData = {
        territory_id: 'tehran',
        weapon_id: 'basic_sword'
      };

      const response = await request(app)
        .post('/api/territories/attack')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-user-id', testUser.id)
        .send(attackData);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('result');
      expect(response.body).to.have.property('new_controller');
    });
  });

  describe('Marketplace Endpoints', () => {
    test('GET /api/marketplace - marketplace items', async () => {
      const response = await request(app)
        .get('/api/marketplace')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-user-id', testUser.id);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('items');
      expect(response.body.items).to.be.an('array');
    });

    test('POST /api/marketplace/buy - purchase item', async () => {
      const purchaseData = {
        item_id: 'energy_boost',
        quantity: 1
      };

      const response = await request(app)
        .post('/api/marketplace/buy')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-user-id', testUser.id)
        .send(purchaseData);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('purchase');
      expect(response.body).to.have.property('new_balance');
    });

    test('GET /api/marketplace/inventory - user inventory', async () => {
      const response = await request(app)
        .get('/api/marketplace/inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-user-id', testUser.id);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('inventory');
      expect(response.body.inventory).to.be.an('array');
    });
  });

  describe('Tournament Endpoints', () => {
    test('GET /api/tournaments - all tournaments', async () => {
      const response = await request(app)
        .get('/api/tournaments')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-user-id', testUser.id);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('tournaments');
      expect(response.body.tournaments).to.be.an('array');
    });

    test('POST /api/tournaments/register - register for tournament', async () => {
      const registrationData = {
        tournament_id: 'test-tournament',
        entry_fee: 100
      };

      const response = await request(app)
        .post('/api/tournaments/register')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-user-id', testUser.id)
        .send(registrationData);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('registration');
    });

    test('GET /api/tournaments/:id/leaderboard - tournament leaderboard', async () => {
      const response = await request(app)
        .get('/api/tournaments/test-tournament/leaderboard')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-user-id', testUser.id);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('leaderboard');
      expect(response.body.leaderboard).to.be.an('array');
    });
  });

  describe('Staking Endpoints', () => {
    test('GET /api/staking/pools - staking pools', async () => {
      const response = await request(app)
        .get('/api/staking/pools')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-user-id', testUser.id);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('pools');
      expect(response.body.pools).to.be.an('array');
    });

    test('POST /api/staking/stake - stake tokens', async () => {
      const stakingData = {
        pool_id: 'conservative',
        amount: 1000
      };

      const response = await request(app)
        .post('/api/staking/stake')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-user-id', testUser.id)
        .send(stakingData);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('position');
    });

    test('POST /api/staking/unstake - unstake tokens', async () => {
      const unstakingData = {
        position_id: 'test-position',
        amount: 500
      };

      const response = await request(app)
        .post('/api/staking/unstake')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-user-id', testUser.id)
        .send(unstakingData);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('unstake');
    });

    test('POST /api/staking/claim - claim rewards', async () => {
      const claimData = {
        position_id: 'test-position'
      };

      const response = await request(app)
        .post('/api/staking/claim')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-user-id', testUser.id)
        .send(claimData);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('claim');
    });
  });

  describe('Guild Endpoints', () => {
    test('GET /api/guilds - all guilds', async () => {
      const response = await request(app)
        .get('/api/guilds')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-user-id', testUser.id)
        .set('x-user-faction', testUser.faction);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('guilds');
      expect(response.body.guilds).to.be.an('array');
    });

    test('POST /api/guilds/join - join guild', async () => {
      const joinData = {
        guild_id: 'test-guild'
      };

      const response = await request(app)
        .post('/api/guilds/join')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-user-id', testUser.id)
        .send(joinData);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('membership');
    });

    test('GET /api/guilds/:id - guild details', async () => {
      const response = await request(app)
        .get('/api/guilds/test-guild')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-user-id', testUser.id);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('guild');
      expect(response.body.guild).to.have.property('id', 'test-guild');
    });
  });

  describe('Leaderboard Endpoints', () => {
    test('GET /api/leaderboard - global leaderboard', async () => {
      const response = await request(app)
        .get('/api/leaderboard')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-user-id', testUser.id);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('leaderboard');
      expect(response.body.leaderboard).to.be.an('array');
    });

    test('GET /api/leaderboard/faction - faction leaderboard', async () => {
      const response = await request(app)
        .get('/api/leaderboard/faction')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-user-id', testUser.id)
        .set('x-user-faction', testUser.faction);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('leaderboard');
      expect(response.body.leaderboard).to.be.an('array');
    });

    test('GET /api/leaderboard/guild - guild leaderboard', async () => {
      const response = await request(app)
        .get('/api/leaderboard/guild')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-user-id', testUser.id);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('leaderboard');
      expect(response.body.leaderboard).to.be.an('array');
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-user-id', testUser.id);

      expect(response.status).to.equal(404);
      expect(response.body).to.have.property('success', false);
    });

    test('should handle missing authentication headers', async () => {
      const response = await request(app)
        .get('/api/profile');

      expect(response.status).to.equal(401);
      expect(response.body).to.have.property('success', false);
    });

    test('should handle invalid authentication token', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', 'Bearer invalid-token')
        .set('x-user-id', testUser.id);

      expect(response.status).to.equal(401);
      expect(response.body).to.have.property('success', false);
    });

    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/battle')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-user-id', testUser.id)
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('success', false);
    });
  });

  describe('Rate Limiting', () => {
    test('should limit API requests', async () => {
      // Make multiple rapid requests
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app)
            .get('/api/profile')
            .set('Authorization', `Bearer ${authToken}`)
            .set('x-user-id', testUser.id)
        );
      }

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).to.be.greaterThan(0);
    });
  });

  describe('Data Validation', () => {
    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/battle')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-user-id', testUser.id)
        .send({}); // Empty object

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('success', false);
      expect(response.body.error).to.include('required');
    });

    test('should validate data types', async () => {
      const response = await request(app)
        .post('/api/battle')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-user-id', testUser.id)
        .send({
          opponent_id: 'test-opponent',
          wager: 'invalid-number', // Should be number
          weapon_id: 'basic_sword',
          territory_id: 'tehran'
        });

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('success', false);
      expect(response.body.error).to.include('number');
    });

    test('should sanitize input data', async () => {
      const response = await request(app)
        .post('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-user-id', testUser.id)
        .send({
          display_name: '<script>alert("xss")</script>',
          bio: 'Test bio'
        });

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      // Script tags should be sanitized
      expect(response.body.profile.display_name).to.not.include('<script>');
    });
  });
});
