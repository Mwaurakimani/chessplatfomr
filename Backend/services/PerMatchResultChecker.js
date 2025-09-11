import axios from 'axios';
import pool from '../config/database.js';
import paymentService from './paymentService.js';

class PerMatchResultChecker {
  constructor() {
    this.activeCheckers = new Map(); // matchId -> { timeoutId, checkCount }
    this.maxChecksPerMatch = 50; // Stop after ~16 minutes of checking (50 * 20 seconds)
    console.log('🎯 [PER_MATCH_CHECKER] Initialized - Per-match dynamic checking system ready');
  }

  // Start checking a specific match after calculated delay
  startCheckingMatch(matchData) {
    const { matchId, timeControl, startedAt, challenger, opponent, platform } = matchData;
    
    // Calculate match duration based on time control
    const estimatedDuration = this.calculateMatchDuration(timeControl);
    const checkDelay = estimatedDuration * 1000; // Convert to milliseconds
    
    console.log(`⏰ [PER_MATCH_CHECKER] Starting checker for match ${matchId} in ${estimatedDuration} seconds`);
    console.log(`🎮 [PER_MATCH_CHECKER] ${challenger} vs ${opponent} on ${platform} (${timeControl})`);
    
    // Start checking after estimated match duration
    const timeoutId = setTimeout(() => {
      this.checkMatchResult(matchId, { challenger, opponent, platform }, 0);
    }, checkDelay);
    
    this.activeCheckers.set(matchId, { timeoutId, checkCount: 0 });
  }

  // Calculate estimated match duration (in seconds)
  calculateMatchDuration(timeControl) {
    if (!timeControl) return 300; // Default 5 minutes
    
    // Parse time control like "1+1", "3+0", "5+3"
    const match = timeControl.match(/(\d+)\+(\d+)/);
    if (!match) return 300;
    
    const minutes = parseInt(match[1]);
    const increment = parseInt(match[2]);
    
    // Estimate: (base_time * 2) + (average_moves * increment * 2)
    // Assume average 30 moves per player
    const estimatedSeconds = (minutes * 60 * 2) + (30 * increment * 2);
    
    console.log(`📊 [PER_MATCH_CHECKER] Time control ${timeControl} = ~${estimatedSeconds} seconds`);
    return estimatedSeconds;
  }

  // Recursively check match result every 20 seconds
  async checkMatchResult(matchId, players, checkCount) {
    if (checkCount >= this.maxChecksPerMatch) {
      console.log(`⏰ [PER_MATCH_CHECKER] Max checks reached for match ${matchId}, stopping`);
      this.stopCheckingMatch(matchId);
      return;
    }

    try {
      console.log(`🔍 [PER_MATCH_CHECKER] Check #${checkCount + 1} for match ${matchId}: ${players.challenger} vs ${players.opponent}`);
      
      // Check if match result exists
      const result = await this.checkChessComResult(players.challenger, players.opponent, players.platform);
      
      if (result) {
        console.log(`🏆 [PER_MATCH_CHECKER] Match ${matchId} result found:`, result);
        await this.processMatchResult(matchId, result);
        this.stopCheckingMatch(matchId);
        return;
      }
      
      console.log(`⌛ [PER_MATCH_CHECKER] No result yet for match ${matchId}, will check again in 20 seconds`);
      
      // Schedule next check in 20 seconds
      const timeoutId = setTimeout(() => {
        this.checkMatchResult(matchId, players, checkCount + 1);
      }, 20000);
      
      // Update timeout ID for this match
      this.activeCheckers.set(matchId, { timeoutId, checkCount: checkCount + 1 });
      
    } catch (error) {
      console.error(`❌ [PER_MATCH_CHECKER] Error checking match ${matchId}:`, error.message);
      
      // Continue checking even on errors (might be temporary API issues)
      const timeoutId = setTimeout(() => {
        this.checkMatchResult(matchId, players, checkCount + 1);
      }, 20000);
      
      this.activeCheckers.set(matchId, { timeoutId, checkCount: checkCount + 1 });
    }
  }

  // Check chess.com API for match result
  async checkChessComResult(challenger, opponent, platform) {
    if (platform !== 'chess.com') {
      console.log(`⚠️ [PER_MATCH_CHECKER] Platform ${platform} not supported for automatic checking`);
      return null;
    }
    
    try {
      // Get recent games for challenger
      const response = await axios.get(`https://api.chess.com/pub/player/${challenger}/games/archives`);
      const archives = response.data.archives;
      
      if (archives.length === 0) return null;
      
      // Get latest archive (current month)
      const latestArchive = archives[archives.length - 1];
      const gamesResponse = await axios.get(latestArchive);
      const games = gamesResponse.data.games;
      
      // Look for recent game between these players
      const cutoffTime = Date.now() - (30 * 60 * 1000); // Last 30 minutes
      
      for (const game of games.reverse()) { // Check newest first
        const gameTime = game.end_time * 1000;
        if (gameTime < cutoffTime) continue;
        
        const whitePlayer = game.white.username.toLowerCase();
        const blackPlayer = game.black.username.toLowerCase();
        
        if ((whitePlayer === challenger.toLowerCase() && blackPlayer === opponent.toLowerCase()) ||
            (whitePlayer === opponent.toLowerCase() && blackPlayer === challenger.toLowerCase())) {
          
          return {
            winner: this.determineWinner(game, challenger, opponent),
            result: game.black.result,
            gameUrl: game.url,
            endTime: new Date(gameTime),
            gameData: {
              white: game.white.username,
              black: game.black.username,
              whiteResult: game.white.result,
              blackResult: game.black.result
            }
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ [PER_MATCH_CHECKER] Chess.com API error:', error.message);
      return null;
    }
  }

  determineWinner(game, challenger, opponent) {
    const challengerColor = game.white.username.toLowerCase() === challenger.toLowerCase() ? 'white' : 'black';
    const challengerResult = challengerColor === 'white' ? game.white.result : game.black.result;
    
    if (challengerResult === 'win') return challenger;
    if (challengerResult === 'lose') return opponent;
    return 'draw';
  }

  async processMatchResult(matchId, result) {
    try {
      console.log(`💰 [PER_MATCH_CHECKER] Processing result for match ${matchId}:`, result);
      
      // Get match and challenge data
      const matchQuery = await pool.query(`
        SELECT om.*, c.bet_amount, c.challenger_phone, c.opponent_phone, c.challenger, c.opponent,
               cu.username as challenger_username, ou.username as opponent_username
        FROM ongoing_matches om
        JOIN challenges c ON om.challenge_id = c.id
        JOIN users cu ON c.challenger = cu.id
        JOIN users ou ON c.opponent = ou.id
        WHERE om.id = $1
      `, [matchId]);
      
      if (matchQuery.rows.length === 0) {
        console.log(`❌ [PER_MATCH_CHECKER] No match data found for match ${matchId}`);
        return;
      }
      
      const match = matchQuery.rows[0];
      
      // Process payment if it's a bet match
      if (match.bet_amount && match.bet_amount > 0) {
        console.log(`💳 [PER_MATCH_CHECKER] Processing payment for bet match ${matchId} (amount: ${match.bet_amount})`);
        await paymentService.processMatchResult(result, match);
      } else {
        console.log(`ℹ️ [PER_MATCH_CHECKER] Match ${matchId} has no bet amount, result logged but no payment processing`);
      }
      
      // Mark match as completed
      await pool.query(`
        UPDATE ongoing_matches 
        SET result_checked = true, match_result = $1, completed_at = NOW()
        WHERE id = $2
      `, [JSON.stringify(result), matchId]);
      
      console.log(`✅ [PER_MATCH_CHECKER] Match ${matchId} processed and marked complete`);
      
    } catch (error) {
      console.error(`❌ [PER_MATCH_CHECKER] Error processing match result:`, error);
    }
  }

  stopCheckingMatch(matchId) {
    const checker = this.activeCheckers.get(matchId);
    if (checker) {
      clearTimeout(checker.timeoutId);
      this.activeCheckers.delete(matchId);
      console.log(`🛑 [PER_MATCH_CHECKER] Stopped checking match ${matchId}`);
    }
  }

  // Manual stop for specific match (can be called from API)
  manualStopCheck(matchId) {
    console.log(`👤 [PER_MATCH_CHECKER] Manual stop requested for match ${matchId}`);
    this.stopCheckingMatch(matchId);
  }

  // Get status of all active checkers
  getStatus() {
    const activeMatches = Array.from(this.activeCheckers.entries()).map(([matchId, data]) => ({
      matchId,
      checkCount: data.checkCount,
      maxChecks: this.maxChecksPerMatch,
      remainingChecks: this.maxChecksPerMatch - data.checkCount
    }));
    
    return {
      activeCheckers: activeMatches.length,
      matches: activeMatches,
      totalMemoryUsage: `~${activeMatches.length * 50} bytes`
    };
  }

  // Clean up all checkers (for shutdown)
  cleanup() {
    console.log(`🧹 [PER_MATCH_CHECKER] Cleaning up ${this.activeCheckers.size} active checkers`);
    for (const [matchId, checker] of this.activeCheckers) {
      clearTimeout(checker.timeoutId);
    }
    this.activeCheckers.clear();
    console.log('✅ [PER_MATCH_CHECKER] All match checkers cleaned up');
  }
}

const perMatchChecker = new PerMatchResultChecker();
export default perMatchChecker;
