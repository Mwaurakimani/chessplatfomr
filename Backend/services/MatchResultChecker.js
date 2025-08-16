import https from 'https';
import OngoingMatch from '../models/OngoingMatch.js';
import User from '../models/User.js';
import pool from '../config/database.js';

class MatchResultChecker {
  constructor(io) {
    this.io = io;
    this.checkInterval = 5 * 60 * 1000; // Check every 5 minutes (much less frequent)
    this.startPeriodicCheck();
    console.log('🔄 Match Result Checker initialized as BACKUP system (every 5 minutes)');
    console.log('ℹ️  Primary method: User reporting via /api/match-results/report-result');
  }

  startPeriodicCheck() {
    setInterval(() => {
      this.checkReadyMatches();
    }, this.checkInterval);
  }

  async checkReadyMatches() {
    try {
      const readyMatches = await OngoingMatch.findReadyMatches();
      console.log(`🔍 [${new Date().toISOString()}] BACKUP CHECKER: Found ${readyMatches.length} matches ready for result checking`);

      if (readyMatches.length === 0) {
        console.log(`⏱️ [${new Date().toISOString()}] BACKUP CHECKER: No matches ready - users should report results manually`);
        return;
      }

      console.log(`ℹ️ [${new Date().toISOString()}] BACKUP CHECKER: Checking matches that users haven't reported yet...`);

      for (const match of readyMatches) {
        // Only check matches that have been running for more than 10 minutes
        const timeSinceStart = new Date() - new Date(match.match_started_at);
        const minutesSinceStart = timeSinceStart / (60 * 1000);
        
        if (minutesSinceStart < 10) {
          console.log(`⏰ [${new Date().toISOString()}] BACKUP CHECKER: Match ${match.id} only ${minutesSinceStart.toFixed(1)} minutes old - waiting for user report`);
          continue;
        }

        console.log(`🎯 [${new Date().toISOString()}] BACKUP CHECKER: Checking match ID ${match.id}: ${match.challenger_username} vs ${match.opponent_username} on ${match.platform}`);
        await this.checkMatchResult(match);
      }
    } catch (error) {
      console.error('❌ BACKUP CHECKER: Error checking ready matches:', error);
    }
  }

  async checkMatchResult(match) {
    try {
      console.log(`🔍 [${new Date().toISOString()}] Checking result for match ${match.id} between ${match.challenger_username} and ${match.opponent_username} on ${match.platform}`);

      let result = null;

      if (match.platform === 'chess.com') {
        console.log(`🌐 [${new Date().toISOString()}] Checking Chess.com API for recent games...`);
        result = await this.checkChessComMatch(match.challenger_username, match.opponent_username);
      } else if (match.platform === 'lichess.org') {
        console.log(`🌐 [${new Date().toISOString()}] Checking Lichess API for recent games...`);
        result = await this.checkLichessMatch(match.challenger_username, match.opponent_username);
      }

      if (result) {
        console.log(`✅ [${new Date().toISOString()}] Found game result for match ${match.id}:`, {
          winner: result.winner,
          result: result.result,
          gameUrl: result.gameUrl,
          gameDate: result.gameDate
        });
        
        await this.processMatchResult(match, result);
        
        console.log(`🏁 [${new Date().toISOString()}] Match ${match.id} processing completed - will stop checking this match`);
      } else {
        console.log(`❌ [${new Date().toISOString()}] No recent match found between ${match.challenger_username} and ${match.opponent_username}`);
        
        // Mark as checked to avoid repeated checking if no match found after reasonable time
        const timeSinceStart = new Date() - new Date(match.match_started_at);
        const minutesSinceStart = timeSinceStart / (60 * 1000);
        
        console.log(`⏰ [${new Date().toISOString()}] Time since match started: ${minutesSinceStart.toFixed(1)} minutes`);
        
        // For testing, mark as checked after 1 minute instead of 10
        if (timeSinceStart > 1 * 60 * 1000) { // 1 minute for testing
          console.log(`⏰ [${new Date().toISOString()}] Match ${match.id} has been running for over 1 minute without result - marking as checked to stop further checking`);
          await OngoingMatch.markResultChecked(match.id);
        } else {
          console.log(`⏰ [${new Date().toISOString()}] Match ${match.id} still within 1-minute window - will continue checking`);
        }
      }
    } catch (error) {
      console.error(`❌ [${new Date().toISOString()}] Error checking match result for ${match.challenger_username} vs ${match.opponent_username}:`, error);
    }
  }

  async checkChessComMatch(player1, player2) {
    return new Promise((resolve) => {
      console.log(`🔍 [${new Date().toISOString()}] Chess.com API: Checking recent games for ${player1} vs ${player2}...`);
      
      // Get recent games for player1
      const options = {
        hostname: 'api.chess.com',
        path: `/pub/player/${player1.toLowerCase()}/games/archives`,
        method: 'GET',
        headers: {
          'User-Agent': 'ChessNexus/1.0 (https://chess-nexus.com)'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', async () => {
          try {
            if (res.statusCode === 200) {
              const archives = JSON.parse(data);
              const latestArchive = archives.archives[archives.archives.length - 1];
              
              console.log(`📅 [${new Date().toISOString()}] Chess.com API: Latest archive URL: ${latestArchive}`);
              
              // Get latest month's games
              const gamesOptions = {
                hostname: 'api.chess.com',
                path: latestArchive.replace('https://api.chess.com', ''),
                method: 'GET',
                headers: {
                  'User-Agent': 'ChessNexus/1.0 (https://chess-nexus.com)'
                }
              };

              const gamesReq = https.request(gamesOptions, (gamesRes) => {
                let gamesData = '';
                gamesRes.on('data', (chunk) => gamesData += chunk);
                gamesRes.on('end', () => {
                  try {
                    if (gamesRes.statusCode === 200) {
                      const gamesJson = JSON.parse(gamesData);
                      console.log(`🎮 [${new Date().toISOString()}] Chess.com API: Found ${gamesJson.games.length} total games for ${player1}`);
                      
                      // Get last 3 games to check
                      const recentGames = gamesJson.games.slice(-3);
                      console.log(`🔬 [${new Date().toISOString()}] Chess.com API: Checking last 3 games for matches...`);
                      
                      // Look for a game between the two players (within reasonable time)
                      const cutoffTime = Date.now() - (15 * 60 * 1000); // 15 minutes ago
                      
                      for (let i = recentGames.length - 1; i >= 0; i--) {
                        const game = recentGames[i];
                        const gameTime = game.end_time * 1000;
                        const gameDate = new Date(gameTime);
                        
                        console.log(`⏰ [${new Date().toISOString()}] Chess.com API: Checking game from ${gameDate.toISOString()}`);
                        
                        if (gameTime < cutoffTime) {
                          console.log(`⏳ [${new Date().toISOString()}] Chess.com API: Game too old (${gameDate.toISOString()}), skipping...`);
                          continue;
                        }
                        
                        const whitePlayer = game.white.username.toLowerCase();
                        const blackPlayer = game.black.username.toLowerCase();
                        const player1Lower = player1.toLowerCase();
                        const player2Lower = player2.toLowerCase();
                        
                        console.log(`👥 [${new Date().toISOString()}] Chess.com API: Game players: ${whitePlayer} (white) vs ${blackPlayer} (black)`);
                        console.log(`🎯 [${new Date().toISOString()}] Chess.com API: Looking for: ${player1Lower} vs ${player2Lower}`);
                        
                        if ((whitePlayer === player1Lower && blackPlayer === player2Lower) ||
                            (whitePlayer === player2Lower && blackPlayer === player1Lower)) {
                          
                          console.log(`🎯 [${new Date().toISOString()}] Chess.com API: MATCH FOUND! Game between ${player1} and ${player2}`);
                          
                          // Found the match!
                          let winner = null;
                          let result = 'draw';
                          
                          console.log(`📊 [${new Date().toISOString()}] Chess.com API: White result: ${game.white.result}, Black result: ${game.black.result}`);
                          
                          if (game.white.result === 'win') {
                            winner = game.white.username;
                            result = 'win';
                            console.log(`🏆 [${new Date().toISOString()}] Chess.com API: White player ${winner} won!`);
                          } else if (game.black.result === 'win') {
                            winner = game.black.username;
                            result = 'win';
                            console.log(`🏆 [${new Date().toISOString()}] Chess.com API: Black player ${winner} won!`);
                          } else {
                            console.log(`🤝 [${new Date().toISOString()}] Chess.com API: Game was a draw`);
                          }
                          
                          const matchResult = {
                            winner,
                            result,
                            gameUrl: game.url,
                            gameDate: new Date(gameTime),
                            whitePlayer: game.white.username,
                            blackPlayer: game.black.username,
                            whiteRating: game.white.rating,
                            blackRating: game.black.rating,
                            timeControl: game.time_class,
                            endReason: game.white.result === 'win' ? 'white_wins' : 
                                     game.black.result === 'win' ? 'black_wins' : 'draw'
                          };
                          
                          console.log(`✅ [${new Date().toISOString()}] Chess.com API: Returning match result:`, matchResult);
                          resolve(matchResult);
                          return;
                        }
                      }
                      
                      console.log(`❌ [${new Date().toISOString()}] Chess.com API: No matches found between ${player1} and ${player2} in last 3 games`);
                      resolve(null);
                    } else {
                      console.log(`❌ [${new Date().toISOString()}] Chess.com API: Games request failed with status ${gamesRes.statusCode}`);
                      resolve(null);
                    }
                  } catch (e) {
                    console.error(`❌ [${new Date().toISOString()}] Chess.com API: Error parsing games:`, e);
                    resolve(null);
                  }
                });
              });
              
              gamesReq.on('error', (error) => {
                console.error(`❌ [${new Date().toISOString()}] Chess.com API: Games request error:`, error);
                resolve(null);
              });
              gamesReq.setTimeout(10000, () => {
                console.log(`⏱️ [${new Date().toISOString()}] Chess.com API: Games request timeout`);
                gamesReq.destroy();
                resolve(null);
              });
              gamesReq.end();
            } else {
              console.log(`❌ [${new Date().toISOString()}] Chess.com API: Archives request failed with status ${res.statusCode}`);
              resolve(null);
            }
          } catch (e) {
            console.error(`❌ [${new Date().toISOString()}] Chess.com API: Error parsing archives:`, e);
            resolve(null);
          }
        });
      });

      req.on('error', (error) => {
        console.error(`❌ [${new Date().toISOString()}] Chess.com API: Archives request error:`, error);
        resolve(null);
      });
      req.setTimeout(10000, () => {
        console.log(`⏱️ [${new Date().toISOString()}] Chess.com API: Archives request timeout`);
        req.destroy();
        resolve(null);
      });
      req.end();
    });
  }

  async checkLichessMatch(player1, player2) {
    return new Promise((resolve) => {
      console.log(`🔍 [${new Date().toISOString()}] Lichess API: Checking recent games for ${player1} vs ${player2}...`);
      
      const options = {
        hostname: 'lichess.org',
        path: `/api/games/user/${player1}?max=3&rated=true&perfType=blitz,rapid,bullet&pgnInJson=false&tags=false&clocks=false&evals=false&opening=false`,
        method: 'GET',
        headers: {
          'User-Agent': 'ChessNexus/1.0',
          'Accept': 'application/x-ndjson'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            if (res.statusCode === 200) {
              const lines = data.trim().split('\n').filter(line => line.trim());
              console.log(`🎮 [${new Date().toISOString()}] Lichess API: Found ${lines.length} recent games for ${player1}`);
              
              const cutoffTime = Date.now() - (15 * 60 * 1000); // 15 minutes ago
              
              for (const line of lines) {
                const game = JSON.parse(line);
                const gameTime = new Date(game.createdAt).getTime();
                const gameDate = new Date(gameTime);
                
                console.log(`⏰ [${new Date().toISOString()}] Lichess API: Checking game from ${gameDate.toISOString()}`);
                
                if (gameTime < cutoffTime) {
                  console.log(`⏳ [${new Date().toISOString()}] Lichess API: Game too old (${gameDate.toISOString()}), skipping...`);
                  continue;
                }
                
                const whitePlayer = game.players.white.user.name.toLowerCase();
                const blackPlayer = game.players.black.user.name.toLowerCase();
                const player1Lower = player1.toLowerCase();
                const player2Lower = player2.toLowerCase();
                
                console.log(`👥 [${new Date().toISOString()}] Lichess API: Game players: ${whitePlayer} (white) vs ${blackPlayer} (black)`);
                console.log(`🎯 [${new Date().toISOString()}] Lichess API: Looking for: ${player1Lower} vs ${player2Lower}`);
                
                if ((whitePlayer === player1Lower && blackPlayer === player2Lower) ||
                    (whitePlayer === player2Lower && blackPlayer === player1Lower)) {
                  
                  console.log(`🎯 [${new Date().toISOString()}] Lichess API: MATCH FOUND! Game between ${player1} and ${player2}`);
                  
                  // Found the match!
                  let winner = null;
                  let result = 'draw';
                  
                  console.log(`📊 [${new Date().toISOString()}] Lichess API: Game winner: ${game.winner || 'none (draw)'}, Status: ${game.status}`);
                  
                  if (game.winner === 'white') {
                    winner = game.players.white.user.name;
                    result = 'win';
                    console.log(`🏆 [${new Date().toISOString()}] Lichess API: White player ${winner} won!`);
                  } else if (game.winner === 'black') {
                    winner = game.players.black.user.name;
                    result = 'win';
                    console.log(`🏆 [${new Date().toISOString()}] Lichess API: Black player ${winner} won!`);
                  } else {
                    console.log(`🤝 [${new Date().toISOString()}] Lichess API: Game was a draw`);
                  }
                  
                  const matchResult = {
                    winner,
                    result,
                    gameUrl: `https://lichess.org/${game.id}`,
                    gameDate: new Date(game.createdAt),
                    whitePlayer: game.players.white.user.name,
                    blackPlayer: game.players.black.user.name,
                    whiteRating: game.players.white.rating,
                    blackRating: game.players.black.rating,
                    timeControl: game.perf,
                    endReason: game.status
                  };
                  
                  console.log(`✅ [${new Date().toISOString()}] Lichess API: Returning match result:`, matchResult);
                  resolve(matchResult);
                  return;
                }
              }
              
              console.log(`❌ [${new Date().toISOString()}] Lichess API: No matches found between ${player1} and ${player2} in last 3 games`);
              resolve(null);
            } else {
              console.log(`❌ [${new Date().toISOString()}] Lichess API: Request failed with status ${res.statusCode}`);
              resolve(null);
            }
          } catch (e) {
            console.error(`❌ [${new Date().toISOString()}] Lichess API: Error parsing games:`, e);
            resolve(null);
          }
        });
      });

      req.on('error', (error) => {
        console.error(`❌ [${new Date().toISOString()}] Lichess API: Request error:`, error);
        resolve(null);
      });
      req.setTimeout(10000, () => {
        console.log(`⏱️ [${new Date().toISOString()}] Lichess API: Request timeout`);
        req.destroy();
        resolve(null);
      });
      req.end();
    });
  }

  async processMatchResult(match, gameResult) {
    try {
      console.log(`🏆 [${new Date().toISOString()}] Processing match result for match ID ${match.id}:`, {
        winner: gameResult.winner,
        result: gameResult.result,
        platform: match.platform,
        gameUrl: gameResult.gameUrl
      });

      // Determine winner and loser IDs
      let winnerId = null;
      let loserId = null;

      if (gameResult.result === 'win') {
        if (gameResult.winner.toLowerCase() === match.challenger_username.toLowerCase()) {
          winnerId = match.challenger_id;
          loserId = match.opponent_id;
          console.log(`🎯 [${new Date().toISOString()}] Challenger ${match.challenger_username} (ID: ${winnerId}) won against opponent ${match.opponent_username} (ID: ${loserId})`);
        } else {
          winnerId = match.opponent_id;
          loserId = match.challenger_id;
          console.log(`🎯 [${new Date().toISOString()}] Opponent ${match.opponent_username} (ID: ${winnerId}) won against challenger ${match.challenger_username} (ID: ${loserId})`);
        }
      } else {
        console.log(`🤝 [${new Date().toISOString()}] Match was a draw between ${match.challenger_username} and ${match.opponent_username}`);
      }

      // Save match result to database
      console.log(`💾 [${new Date().toISOString()}] Saving match result to database...`);
      const insertResult = await pool.query(`
        INSERT INTO match_results (
          challenge_id, winner_id, loser_id, result, platform, 
          game_url, match_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        match.challenge_id,
        winnerId,
        loserId,
        gameResult.result,
        match.platform,
        gameResult.gameUrl,
        gameResult.gameDate
      ]);

      console.log(`✅ [${new Date().toISOString()}] Match result saved to database:`, {
        resultId: insertResult.rows[0].id,
        challengeId: match.challenge_id,
        winnerId: winnerId,
        loserId: loserId,
        result: gameResult.result
      });

      // Mark ongoing match as checked (THIS STOPS FURTHER CHECKING)
      console.log(`🔒 [${new Date().toISOString()}] Marking ongoing match ${match.id} as result_checked=TRUE to stop further API checking...`);
      await OngoingMatch.markResultChecked(match.id, winnerId, gameResult.result);
      console.log(`✅ [${new Date().toISOString()}] Ongoing match ${match.id} marked as checked - no more API calls will be made for this match`);

      // Send victory notification to winner
      if (winnerId && gameResult.result === 'win') {
        const loserUsername = winnerId === match.challenger_id ? 
          match.opponent_username : match.challenger_username;

        console.log(`🎉 [${new Date().toISOString()}] Sending victory notification to user ID ${winnerId}...`);
        
        const notificationData = {
          message: `Chequemate! You won against ${loserUsername}!`,
          opponent: loserUsername,
          platform: match.platform,
          gameUrl: gameResult.gameUrl
        };

        this.io.to(winnerId.toString()).emit('victory-notification', notificationData);

        console.log(`📢 [${new Date().toISOString()}] Victory notification sent to user ${winnerId} for win against ${loserUsername}:`, notificationData);
      }

      // Update challenge status to completed
      console.log(`📝 [${new Date().toISOString()}] Updating challenge ${match.challenge_id} status to 'completed'...`);
      await pool.query(`
        UPDATE challenges SET status = 'completed' WHERE id = $1
      `, [match.challenge_id]);

      console.log(`🎊 [${new Date().toISOString()}] Match result processing completed successfully for challenge ${match.challenge_id}!`);

    } catch (error) {
      console.error(`❌ [${new Date().toISOString()}] Error processing match result:`, error);
    }
  }
}

export default MatchResultChecker;
