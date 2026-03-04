const { query } = require('./connection');

async function seed() {
  try {
    console.log('Starting database seeding...');

    // Insert initial territories
    await query(`
      INSERT INTO territories (name, description, controlling_faction, iran_score, usa_score) VALUES
      ('Tehran', 'Capital of Iran', 'iran', 1000, 500),
      ('Washington D.C.', 'Capital of USA', 'usa', 300, 1500),
      ('New York', 'Financial hub of USA', 'usa', 200, 1200),
      ('Los Angeles', 'West coast USA', 'usa', 150, 1000),
      ('Chicago', 'Midwest USA', 'neutral', 400, 400),
      ('Houston', 'Southern USA', 'neutral', 300, 300),
      ('Isfahan', 'Historical city of Iran', 'iran', 800, 200),
      ('Mashhad', 'Holy city of Iran', 'iran', 700, 150),
      ('Tabriz', 'Northwestern Iran', 'iran', 600, 250),
      ('Shiraz', 'Southern Iran', 'iran', 500, 200),
      ('London', 'European territory', 'neutral', 450, 450),
      ('Paris', 'European territory', 'neutral', 400, 400),
      ('Berlin', 'European territory', 'neutral', 350, 350),
      ('Tokyo', 'Asian territory', 'neutral', 300, 300),
      ('Sydney', 'Pacific territory', 'neutral', 250, 250)
      ON CONFLICT DO NOTHING
    `);

    // Insert initial daily missions
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    await query(`
      INSERT INTO daily_missions (title, description, mission_type, target_value, stg_reward, win_reward, valid_until) VALUES
      ('Tap Master', 'Perform 100 taps', 'taps', 100, 500, 10, $1),
      ('Battle Winner', 'Win 5 PvP battles', 'pvp_wins', 5, 1000, 25, $1),
      ('Faction Loyalist', 'Earn 1000 STG for your faction', 'stg_earned', 1000, 750, 15, $1),
      ('Social Butterfly', 'Share your achievements 3 times', 'social_shares', 3, 300, 5, $1),
      ('Territory Conqueror', 'Participate in 10 territory battles', 'territory_battles', 10, 800, 20, $1),
      ('Daily Player', 'Log in for 7 consecutive days', 'daily_login', 7, 2000, 50, $1),
      ('Referral Champion', 'Invite 3 new players', 'referrals', 3, 1500, 35, $1),
      ('Level Up', 'Reach level 10', 'level', 10, 3000, 75, $1)
      ON CONFLICT DO NOTHING
    `, [tomorrow]);

    // Insert initial game events
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    await query(`
      INSERT INTO game_events (event_type, title, description, start_time, end_time, rewards, is_active) VALUES
      ('faction_war', 'Great Faction War', 'A week-long battle between Iran and USA factions for global dominance!', CURRENT_TIMESTAMP, $1, '{"winner_bonus": 10000, "participant_bonus": 1000}', true),
      ('double_rewards', 'Double Rewards Weekend', 'All STG rewards are doubled this weekend!', CURRENT_TIMESTAMP, $1, '{"multiplier": 2}', false),
      ('tournament', 'Championship Tournament', 'The best players compete for massive WIN rewards!', CURRENT_TIMESTAMP, $1, '{"first_place": 5000, "second_place": 3000, "third_place": 1000}', false)
      ON CONFLICT DO NOTHING
    `, [nextWeek]);

    // Insert sample leaderboard data
    await query(`
      INSERT INTO leaderboards (type, faction, period_start, period_end, data) VALUES
      ('global', NULL, CURRENT_TIMESTAMP - INTERVAL '24 hours', CURRENT_TIMESTAMP, '{"top_players": [], "total_players": 0}'),
      ('faction', 'iran', CURRENT_TIMESTAMP - INTERVAL '24 hours', CURRENT_TIMESTAMP, '{"top_players": [], "total_players": 0}'),
      ('faction', 'usa', CURRENT_TIMESTAMP - INTERVAL '24 hours', CURRENT_TIMESTAMP, '{"top_players": [], "total_players": 0}'),
      ('daily', NULL, CURRENT_TIMESTAMP - INTERVAL '24 hours', CURRENT_TIMESTAMP, '{"top_players": [], "total_players": 0}'),
      ('weekly', NULL, CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP, '{"top_players": [], "total_players": 0}')
      ON CONFLICT DO NOTHING
    `);

    console.log('✅ Database seeding completed successfully');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seed()
    .then(() => {
      console.log('Seeding completed. Exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seed };
