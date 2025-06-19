const Game = require('../models/Game');

const CHESS_COM_API = 'https://api.chess.com/pub';
const LICHESS_API = 'https://lichess.org/api';

// Validate player exists on specified platform
async function validatePlayer(username, platform) {
  try {
    let response, platformName;
    
    if (platform === 'chess.com') {
      response = await fetch(`${CHESS_COM_API}/player/${username.toLowerCase()}`);
      platformName = 'Chess.com';
    } else if (platform === 'lichess.org') {
      response = await fetch(`${LICHESS_API}/user/${username}`);
      platformName = 'Lichess.org';
    }
    
    if (response.status === 200) {
      const data = await response.json();
      return { valid: true, data: data };
    } else if (response.status === 404) {
      return { 
        valid: false, 
        error: `Player "${username}" not found on ${platformName}` 
      };
    } else {
      return { 
        valid: false, 
        error: `Error checking player "${username}" on ${platformName}: ${response.status}` 
      };
    }
  } catch (error) {
    const platformName = platform === 'chess.com' ? 'Chess.com' : 'Lichess.org';
    return { 
      valid: false, 
      error: `Network error checking player "${username}" on ${platformName}: ${error.message}` 
    };
  }
}

// Generate challenge URLs for both players
function generateChallengeUrls(player1, player2, platform) {
  let player1ChallengeUrl, player2ChallengeUrl;
  
  if (platform === 'chess.com') {
    player1ChallengeUrl = `https://www.chess.com/play/online/new?opponent=${player2.toLowerCase()}`;
    player2ChallengeUrl = `https://www.chess.com/play/online/new?opponent=${player1.toLowerCase()}`;
  } else if (platform === 'lichess.org') {
    player1ChallengeUrl = `https://lichess.org/?user=${player2.toLowerCase()}#friend`;
    player2ChallengeUrl = `https://lichess.org/?user=${player1.toLowerCase()}#friend`;
  }
  
  return { player1ChallengeUrl, player2ChallengeUrl };
}

// Create a new match
const createMatch = async (req, res) => {
  try {
    const { player1, player2, platform = 'chess.com' } = req.body;
    
    // Validate input
    if (!player1 || !player2) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both player usernames'
      });
    }
    
    if (player1.toLowerCase() === player2.toLowerCase()) {
      return res.status(400).json({
        success: false,
        error: 'Player usernames must be different'
      });
    }
    
    // Validate both players exist on the platform
    const [player1Result, player2Result] = await Promise.all([
      validatePlayer(player1.trim(), platform),
      validatePlayer(player2.trim(), platform)
    ]);
    
    if (!player1Result.valid) {
      return res.status(400).json({
        success: false,
        error: player1Result.error
      });
    }
    
    if (!player2Result.valid) {
      return res.status(400).json({
        success: false,
        error: player2Result.error
      });
    }
    
    // Generate challenge URLs
    const { player1ChallengeUrl, player2ChallengeUrl } = generateChallengeUrls(
      player1.trim(), 
      player2.trim(), 
      platform
    );
    
    // Create new game record
    const newGame = new Game({
      player1: player1.trim(),
      player2: player2.trim(),
      platform,
      player1ChallengeUrl,
      player2ChallengeUrl
    });
    
    const savedGame = await newGame.save();
    
    res.status(201).json({
      success: true,
      message: `Match created successfully between ${player1} and ${player2}`,
      data: {
        gameId: savedGame._id,
        player1: savedGame.player1,
        player2: savedGame.player2,
        platform: savedGame.platform,
        player1ChallengeUrl: savedGame.player1ChallengeUrl,
        player2ChallengeUrl: savedGame.player2ChallengeUrl,
        status: savedGame.status,
        createdAt: savedGame.createdAt
      }
    });
    
  } catch (error) {
    console.error('Error creating match:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while creating match'
    });
  }
};

// Get match by ID
const getMatch = async (req, res) => {
  try {
    const { id } = req.params;
    
    const game = await Game.findById(id);
    
    if (!game) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }
    
    res.json({
      success: true,
      data: game
    });
    
  } catch (error) {
    console.error('Error fetching match:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching match'
    });
  }
};

// Update match status
const updateMatchStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'active', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Valid statuses are: ' + validStatuses.join(', ')
      });
    }
    
    const game = await Game.findByIdAndUpdate(
      id, 
      { status, updatedAt: Date.now() }, 
      { new: true }
    );
    
    if (!game) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }
    
    res.json({
      success: true,
      message: `Match status updated to ${status}`,
      data: game
    });
    
  } catch (error) {
    console.error('Error updating match:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while updating match'
    });
  }
};

// Get all matches (with optional filtering)
const getAllMatches = async (req, res) => {
  try {
    const { platform, status, player } = req.query;
    const filter = {};
    
    if (platform) filter.platform = platform;
    if (status) filter.status = status;
    if (player) {
      filter.$or = [
        { player1: new RegExp(player, 'i') },
        { player2: new RegExp(player, 'i') }
      ];
    }
    
    const games = await Game.find(filter).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: games,
      count: games.length
    });
    
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching matches'
    });
  }
};

module.exports = {
  createMatch,
  getMatch,
  updateMatchStatus,
  getAllMatches,
  validatePlayer // Export for potential reuse
};



// import asyncHandler from 'express-async-handler';
// import Game from '../models/Game.js';
// import Challenge from '../models/Challenge.js';

// // @desc    Record a game result
// // @route   POST /api/games
// // @access  Private
// export const recordGame = asyncHandler(async (req, res) => {
//   const { challengeId, result } = req.body;

//   if (!challengeId || !result) {
//     res.status(400);
//     throw new Error('Please include challengeId and result');
//   }

//   const challenge = await Challenge.findById(challengeId);
//   if (!challenge) {
//     res.status(404);
//     throw new Error('Challenge not found');
//   }

//   const game = await Game.create({
//     challenge: challenge._id,
//     result
//   });

//   challenge.status = 'completed';
//   await challenge.save();

//   res.status(201).json(game);
// });

// // @desc    Get all games
// // @route   GET /api/games
// // @access  Private
// export const getGames = asyncHandler(async (req, res) => {
//   const games = await Game.find()
//     .populate({
//       path: 'challenge',
//       populate: [
//         { path: 'challenger', select: 'username' },
//         { path: 'opponent', select: 'username' }
//       ]
//     });

//   res.json(games);
// });
