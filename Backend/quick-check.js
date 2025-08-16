import pool from './config/database.js';

async function quickCheck() {
  try {
    console.log('🔍 Quick database check...');
    
    // Check if we have any data at all
    const tables = ['ongoing_matches', 'challenges', 'users'];
    
    for (const table of tables) {
      const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`📊 ${table}: ${result.rows[0].count} records`);
    }
    
    // Check recent challenges
    const recentChallenges = await pool.query(`
      SELECT id, challenger_id, opponent_id, platform, status, created_at 
      FROM challenges 
      ORDER BY created_at DESC 
      LIMIT 3
    `);
    
    console.log('📋 Recent challenges:');
    recentChallenges.rows.forEach(c => {
      console.log(`  ID: ${c.id}, Status: ${c.status}, Platform: ${c.platform}, Created: ${c.created_at}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

quickCheck();
