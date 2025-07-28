import asyncHandler from 'express-async-handler';
import bcrypt from 'bcryptjs';
import https from 'https';
import User from '../models/User.js';
import { generateToken } from '../config/auth.js';

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
export const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    res.status(400);
    throw new Error('Please include username, email and password');
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    username,
    email,
    password: hashedPassword
  });

  if (user) {
    res.status(201).json({
      id: user._id,
      username: user.username,
      email: user.email,
      token: generateToken(user._id)
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/users/login
// @access  Public
export const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (user && (await bcrypt.compare(password, user.password))) {
    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      token: generateToken(user._id)
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// Helper function to fetch Chess.com recent games
const fetchChessComRecentGames = (username) => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.chess.com',
      path: `/pub/player/${username}/games/2024/12`,
      method: 'GET',
      headers: {
        'User-Agent': 'ChessNexus/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const parsed = JSON.parse(data);
            const games = parsed.games || [];
            // Get last 10 games and format them
            const recentGames = games.slice(-10).map(game => {
              const isWhite = game.white.username.toLowerCase() === username.toLowerCase();
              const opponent = isWhite ? game.black : game.white;
              let result = 'Draw';
              
              if (game.white.result === 'win') {
                result = isWhite ? 'Win' : 'Loss';
              } else if (game.black.result === 'win') {
                result = isWhite ? 'Loss' : 'Win';
              }
              
              return {
                opponent: opponent.username,
                opponentRating: opponent.rating,
                result: result,
                date: new Date(game.end_time * 1000).toLocaleDateString(),
                rating: isWhite ? game.white.rating : game.black.rating
              };
            });
            resolve(recentGames);
          } else {
            resolve([]);
          }
        } catch (e) {
          resolve([]);
        }
      });
    });

    req.on('error', () => resolve([]));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve([]);
    });
    req.end();
  });
};

// Helper function to fetch Lichess recent games
const fetchLichessRecentGames = (username) => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'lichess.org',
      path: `/api/games/user/${username}?max=10&rated=true&perfType=blitz,rapid,bullet`,
      method: 'GET',
      headers: {
        'User-Agent': 'ChessNexus/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const lines = data.trim().split('\n').filter(line => line);
            const recentGames = lines.slice(-10).map(line => {
              const game = JSON.parse(line);
              const isWhite = game.players.white.user.name.toLowerCase() === username.toLowerCase();
              const opponent = isWhite ? game.players.black : game.players.white;
              let result = 'Draw';
              
              if (game.winner === 'white') {
                result = isWhite ? 'Win' : 'Loss';
              } else if (game.winner === 'black') {
                result = isWhite ? 'Loss' : 'Win';
              }
              
              return {
                opponent: opponent.user.name,
                opponentRating: opponent.rating,
                result: result,
                date: new Date(game.createdAt).toLocaleDateString(),
                rating: isWhite ? game.players.white.rating : game.players.black.rating
              };
            });
            resolve(recentGames);
          } else {
            resolve([]);
          }
        } catch (e) {
          resolve([]);
        }
      });
    });

    req.on('error', () => resolve([]));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve([]);
    });
    req.end();
  });
};
const fetchChessComRating = (username) => {
  return new Promise((resolve) => {
    if (!username) {
      console.log('No Chess.com username provided, returning null');
      resolve(null);
      return;
    }

    const options = {
      hostname: 'api.chess.com',
      path: `/pub/player/${username.toLowerCase()}/stats`,
      method: 'GET',
      timeout: 8000,
      headers: {
        'User-Agent': 'ChessNexus/1.0 (https://chess-nexus.com)',
        'Accept': 'application/json'
      }
    };

    console.log(`Fetching Chess.com rating for profile: ${username}`);

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          console.log(`Chess.com profile API response status for ${username}: ${res.statusCode}`);
          
          if (res.statusCode === 200) {
            const parsed = JSON.parse(data);
            
            // Try different rating types in order of preference
            let blitzRating = 0, rapidRating = 0, bulletRating = 0;
            
            if (parsed.chess_rapid?.last?.rating) {
              rapidRating = parsed.chess_rapid.last.rating;
              console.log(`Found Chess.com rapid rating for ${username}: ${rapidRating}`);
            }
            
            if (parsed.chess_blitz?.last?.rating) {
              blitzRating = parsed.chess_blitz.last.rating;
              console.log(`Found Chess.com blitz rating for ${username}: ${blitzRating}`);
            }
            
            if (parsed.chess_bullet?.last?.rating) {
              bulletRating = parsed.chess_bullet.last.rating;
              console.log(`Found Chess.com bullet rating for ${username}: ${bulletRating}`);
            }

            const highest = Math.max(blitzRating, rapidRating, bulletRating);
            console.log(`Chess.com highest rating for ${username}: ${highest}`);
            
            resolve({
              blitz: blitzRating,
              rapid: rapidRating,
              bullet: bulletRating,
              highest: highest
            });
          } else {
            console.log(`Chess.com API returned non-200 status for ${username}: ${res.statusCode}`);
            resolve(null);
          }
        } catch (e) {
          console.error(`Error parsing Chess.com response for ${username}:`, e.message);
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      console.error(`Chess.com request error for ${username}:`, error.message);
      resolve(null);
    });
    
    req.on('timeout', () => {
      console.log(`Chess.com request timeout for ${username}`);
      req.destroy();
      resolve(null);
    });
    
    req.end();
  });
};

// Helper function to fetch Lichess rating
const fetchLichessRating = (username) => {
  return new Promise((resolve) => {
    if (!username) {
      console.log('No Lichess username provided, returning null');
      resolve(null);
      return;
    }

    const options = {
      hostname: 'lichess.org',
      path: `/api/user/${username}`,
      method: 'GET',
      timeout: 8000,
      headers: {
        'User-Agent': 'ChessNexus/1.0 (https://chess-nexus.com)',
        'Accept': 'application/json'
      }
    };

    console.log(`Fetching Lichess rating for profile: ${username}`);

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          console.log(`Lichess profile API response status for ${username}: ${res.statusCode}`);
          
          if (res.statusCode === 200) {
            const parsed = JSON.parse(data);
            const perfs = parsed.perfs || {};
            
            // Try different rating types in order of preference
            let blitzRating = 0, rapidRating = 0, bulletRating = 0;
            
            if (perfs.rapid?.rating) {
              rapidRating = perfs.rapid.rating;
              console.log(`Found Lichess rapid rating for ${username}: ${rapidRating}`);
            }
            
            if (perfs.blitz?.rating) {
              blitzRating = perfs.blitz.rating;
              console.log(`Found Lichess blitz rating for ${username}: ${blitzRating}`);
            }
            
            if (perfs.bullet?.rating) {
              bulletRating = perfs.bullet.rating;
              console.log(`Found Lichess bullet rating for ${username}: ${bulletRating}`);
            }

            const highest = Math.max(blitzRating, rapidRating, bulletRating);
            console.log(`Lichess highest rating for ${username}: ${highest}`);
            
            resolve({
              blitz: blitzRating,
              rapid: rapidRating,
              bullet: bulletRating,
              highest: highest
            });
          } else {
            console.log(`Lichess API returned non-200 status for ${username}: ${res.statusCode}`);
            resolve(null);
          }
        } catch (e) {
          console.error(`Error parsing Lichess response for ${username}:`, e.message);
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      console.error(`Lichess request error for ${username}:`, error.message);
      resolve(null);
    });
    
    req.on('timeout', () => {
      console.log(`Lichess request timeout for ${username}`);
      req.destroy();
      resolve(null);
    });
    
    req.end();
  });
};

// @desc    Get user by username
// @route   GET /api/users/profile/:username
// @access  Private
export const getUserByUsername = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const { forceRefresh } = req.query; // Add support for force refresh
  
  const user = await User.findByUsername(username);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Remove password from response
  const { password, ...userWithoutPassword } = user;

  // Check if we need to refresh rating data (every 5 minutes for testing, or if forced)
  const now = new Date();
  const shouldRefreshRating = forceRefresh === 'true' || !user.last_rating_update || 
    (now - new Date(user.last_rating_update)) > 5 * 60 * 1000; // 5 minutes for testing

  let updatedUser = userWithoutPassword;

  if (shouldRefreshRating) {
    console.log(`Refreshing rating for user: ${username}`);
    try {
      let chessRatings = null;
      
      // Fetch from preferred platform first
      if (user.preferred_platform === 'chess.com' && user.chess_com_username) {
        console.log(`Fetching Chess.com rating for ${username}: ${user.chess_com_username}`);
        chessRatings = await fetchChessComRating(user.chess_com_username);
      } else if (user.preferred_platform === 'lichess.org' && user.lichess_username) {
        console.log(`Fetching Lichess rating for ${username}: ${user.lichess_username}`);
        chessRatings = await fetchLichessRating(user.lichess_username);
      }
      
      // If preferred platform failed or no rating found, try the other platform
      if (!chessRatings || chessRatings.highest === 0) {
        console.log(`Primary platform failed for ${username}, trying fallback...`);
        if (user.chess_com_username && user.preferred_platform !== 'chess.com') {
          console.log(`Trying Chess.com fallback for ${username}: ${user.chess_com_username}`);
          chessRatings = await fetchChessComRating(user.chess_com_username);
        } else if (user.lichess_username && user.preferred_platform !== 'lichess.org') {
          console.log(`Trying Lichess fallback for ${username}: ${user.lichess_username}`);
          chessRatings = await fetchLichessRating(user.lichess_username);
        }
      }

      if (chessRatings && chessRatings.highest > 0) {
        console.log(`Updating rating cache for ${username}: ${chessRatings.highest}`);
        const ratingData = {
          currentRating: chessRatings.highest,
          chessRatings: chessRatings
        };
        
        const updated = await User.updateRatingCache(username, ratingData);
        if (updated) {
          console.log(`Successfully updated rating for ${username}: ${updated.current_rating}`);
          const { password, ...updatedWithoutPassword } = updated;
          updatedUser = updatedWithoutPassword;
        }
      } else {
        console.log(`No valid rating found for ${username}, keeping existing data`);
      }
    } catch (error) {
      console.error(`Error fetching chess ratings for ${username}:`, error);
    }
  } else {
    console.log(`Rating cache still valid for ${username}, not refreshing`);
  }

  console.log(`Returning user data for ${username}:`, {
    id: updatedUser.id,
    username: updatedUser.username,
    current_rating: updatedUser.current_rating,
    preferred_platform: updatedUser.preferred_platform,
    chess_com_username: updatedUser.chess_com_username,
    lichess_username: updatedUser.lichess_username,
    last_rating_update: updatedUser.last_rating_update
  });

  res.json(updatedUser);
});

// @desc    Get user recent matches
// @route   GET /api/users/profile/:username/matches
// @access  Private
export const getUserRecentMatches = asyncHandler(async (req, res) => {
  const { username } = req.params;
  
  const user = await User.findByUsername(username);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  try {
    let recentMatches = [];
    
    // Fetch from preferred platform first
    if (user.preferred_platform === 'chess.com' && user.chess_com_username) {
      recentMatches = await fetchChessComRecentGames(user.chess_com_username);
    } else if (user.preferred_platform === 'lichess.org' && user.lichess_username) {
      recentMatches = await fetchLichessRecentGames(user.lichess_username);
    }
    
    // If preferred platform failed or no data, try the other platform
    if (recentMatches.length === 0) {
      if (user.chess_com_username) {
        recentMatches = await fetchChessComRecentGames(user.chess_com_username);
      } else if (user.lichess_username) {
        recentMatches = await fetchLichessRecentGames(user.lichess_username);
      }
    }

    // Calculate basic stats from recent matches
    const stats = {
      totalGames: recentMatches.length,
      wins: recentMatches.filter(match => match.result === 'Win').length,
      losses: recentMatches.filter(match => match.result === 'Loss').length,
      draws: recentMatches.filter(match => match.result === 'Draw').length
    };
    stats.winRate = stats.totalGames > 0 ? Math.round((stats.wins / stats.totalGames) * 100) : 0;

    res.json({
      matches: recentMatches,
      stats: stats
    });
  } catch (error) {
    console.error('Error fetching recent matches:', error);
    res.json({
      matches: [],
      stats: {
        totalGames: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        winRate: 0
      }
    });
  }
});

// @desc    Get user chess statistics
// @route   GET /api/users/profile/:username/stats
// @access  Private
export const getUserStats = asyncHandler(async (req, res) => {
  const { username } = req.params;
  
  const user = await User.findByUsername(username);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  try {
    let stats = {
      totalGames: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      winRate: 0
    };

    // Fetch stats from preferred platform
    if (user.preferred_platform === 'chess.com' && user.chess_com_username) {
      const chessComStats = await fetchChessComStats(user.chess_com_username);
      if (chessComStats) {
        // Combine stats from all game types
        const allStats = [chessComStats.blitz, chessComStats.rapid, chessComStats.bullet];
        stats = allStats.reduce((acc, gameType) => ({
          wins: acc.wins + gameType.wins,
          losses: acc.losses + gameType.losses,
          draws: acc.draws + gameType.draws,
          totalGames: acc.totalGames + gameType.wins + gameType.losses + gameType.draws
        }), { wins: 0, losses: 0, draws: 0, totalGames: 0 });
        
        stats.winRate = stats.totalGames > 0 ? Math.round((stats.wins / stats.totalGames) * 100) : 0;
      }
    } else if (user.preferred_platform === 'lichess.org' && user.lichess_username) {
      const lichessStats = await fetchLichessStats(user.lichess_username);
      if (lichessStats) {
        // Combine stats from all game types
        const allStats = [lichessStats.blitz, lichessStats.rapid, lichessStats.bullet];
        stats = allStats.reduce((acc, gameType) => ({
          wins: acc.wins + gameType.wins,
          losses: acc.losses + gameType.losses,
          draws: acc.draws + gameType.draws,
          totalGames: acc.totalGames + gameType.wins + gameType.losses + gameType.draws
        }), { wins: 0, losses: 0, draws: 0, totalGames: 0 });
        
        stats.winRate = stats.totalGames > 0 ? Math.round((stats.wins / stats.totalGames) * 100) : 0;
      }
    }

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.json({
      stats: {
        totalGames: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        winRate: 0
      }
    });
  }
});

// Helper function to fetch chess.com stats
const fetchChessComStats = (username) => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.chess.com',
      path: `/pub/player/${username}/stats`,
      method: 'GET',
      headers: {
        'User-Agent': 'ChessNexus/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const parsed = JSON.parse(data);
            const stats = {
              blitz: {
                rating: parsed.chess_blitz?.last?.rating || 0,
                wins: parsed.chess_blitz?.record?.win || 0,
                losses: parsed.chess_blitz?.record?.loss || 0,
                draws: parsed.chess_blitz?.record?.draw || 0
              },
              rapid: {
                rating: parsed.chess_rapid?.last?.rating || 0,
                wins: parsed.chess_rapid?.record?.win || 0,
                losses: parsed.chess_rapid?.record?.loss || 0,
                draws: parsed.chess_rapid?.record?.draw || 0
              },
              bullet: {
                rating: parsed.chess_bullet?.last?.rating || 0,
                wins: parsed.chess_bullet?.record?.win || 0,
                losses: parsed.chess_bullet?.record?.loss || 0,
                draws: parsed.chess_bullet?.record?.draw || 0
              }
            };
            resolve(stats);
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve(null);
    });
    req.end();
  });
};

// Helper function to fetch Lichess stats
const fetchLichessStats = (username) => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'lichess.org',
      path: `/api/user/${username}`,
      method: 'GET',
      headers: {
        'User-Agent': 'ChessNexus/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const parsed = JSON.parse(data);
            const perfs = parsed.perfs || {};
            const stats = {
              blitz: {
                rating: perfs.blitz?.rating || 0,
                wins: perfs.blitz?.wins || 0,
                losses: perfs.blitz?.losses || 0,
                draws: perfs.blitz?.draws || 0
              },
              rapid: {
                rating: perfs.rapid?.rating || 0,
                wins: perfs.rapid?.wins || 0,
                losses: perfs.rapid?.losses || 0,
                draws: perfs.rapid?.draws || 0
              },
              bullet: {
                rating: perfs.bullet?.rating || 0,
                wins: perfs.bullet?.wins || 0,
                losses: perfs.bullet?.losses || 0,
                draws: perfs.bullet?.draws || 0
              }
            };
            resolve(stats);
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve(null);
    });
    req.end();
  });
};
