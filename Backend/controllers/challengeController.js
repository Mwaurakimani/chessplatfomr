import asyncHandler from 'express-async-handler';
import fetch from 'node-fetch';
import Challenge from '../models/Challenge.js';
import User from '../models/User.js';
import pool from '../config/database.js';

const CHESS_COM_API = 'https://api.chess.com/pub';
const LICHESS_API = 'https://lichess.org/api';

async function validatePlayer(username, platform) {
  let res, name;
  if (platform === 'chess.com') {
    name = 'Chess.com';
    res = await fetch(`${CHESS_COM_API}/player/${username.toLowerCase()}`);
  } else {
    name = 'Lichess.org';
    res = await fetch(`${LICHESS_API}/user/${username}`);
  }

  if (res.status === 200) {
    return { valid: true, data: await res.json() };
  }
  if (res.status === 404) {
    return { valid: false, error: `Player "${username}" not found on ${name}` };
  }
  return { valid: false, error: `Error ${res.status} checking "${username}" on ${name}` };
}

export const createMatch = asyncHandler(async (req, res) => {
  const { challengerName, opponentName, platform } = req.body;

  if (!challengerName || !opponentName || !platform) {
    res.status(400);
    throw new Error('challengerName, opponentName and platform are required');
  }
  if (challengerName.toLowerCase() === opponentName.toLowerCase()) {
    res.status(400);
    throw new Error('Challenger and opponent must be different');
  }

  const challengerUser = await User.findByUsername(challengerName);
  const opponentUser = await User.findByUsername(opponentName);

  if (!challengerUser || !opponentUser) {
    res.status(404);
    throw new Error('One or both users not found');
  }

  const createdChallenge = await Challenge.create({
    challenger: challengerUser.id,
    opponent: opponentUser.id,
    platform,
  });

  const io = req.app.get('socketio');
  io.to(opponentUser.id.toString()).emit('newChallenge', createdChallenge);

  res.status(201).json(createdChallenge);
});

export const getChallenges = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const challenges = await Challenge.findByUserId(userId);
  res.json(challenges);
});


export const validatePlayerController = asyncHandler(async (req, res) => {
  const { username, platform } = req.body;
  if (!username || !platform) {
    res.status(400);
    throw new Error('username and platform are required');
  }
  const result = await validatePlayer(username, platform);
  res.json(result);
});

export const acceptChallenge = asyncHandler(async (req, res) => {
  const { challengeId } = req.params;
  
  try {
    const updatedChallenge = await Challenge.updateStatus(challengeId, 'accepted');
    
    if (!updatedChallenge) {
      res.status(404);
      throw new Error('Challenge not found');
    }

    // Get the full challenge details with user info
    const challenges = await Challenge.findByUserId(updatedChallenge.challenger);
    const challenge = challenges.find(c => c.id == challengeId);
    
    if (challenge) {
      const io = req.app.get('socketio');
      
      const notificationData = {
        challengeId,
        challengerId: challenge.challenger.id,
        challengerUsername: challenge.challenger.username,
        accepterUsername: challenge.opponent.username,
        challenge
      };
      
      // Notify the challenger that their challenge was accepted
      io.to(challenge.challenger.id.toString()).emit('challengeAccepted', notificationData);
    }

    res.json({ 
      success: true, 
      message: 'Challenge accepted', 
      challenge: challenge || updatedChallenge 
    });
  } catch (error) {
    res.status(500);
    throw new Error('Failed to accept challenge');
  }
});

export const declineChallenge = asyncHandler(async (req, res) => {
  const { challengeId } = req.params;
  
  try {
    const updatedChallenge = await Challenge.updateStatus(challengeId, 'declined');
    
    if (!updatedChallenge) {
      res.status(404);
      throw new Error('Challenge not found');
    }

    res.json({ 
      success: true, 
      message: 'Challenge declined', 
      challenge: updatedChallenge 
    });
  } catch (error) {
    res.status(500);
    throw new Error('Failed to decline challenge');
  }
});

export const cancelChallenge = asyncHandler(async (req, res) => {
  const { challengeId } = req.params;
  
  try {
    const updatedChallenge = await Challenge.updateStatus(challengeId, 'cancelled');
    
    if (!updatedChallenge) {
      res.status(404);
      throw new Error('Challenge not found');
    }

    res.json({ 
      success: true, 
      message: 'Challenge cancelled', 
      challenge: updatedChallenge 
    });
  } catch (error) {
    res.status(500);
    throw new Error('Failed to cancel challenge');
  }
});

export const postponeChallenge = asyncHandler(async (req, res) => {
  const { challengeId } = req.params;
  
  try {
    const updatedChallenge = await Challenge.updateStatus(challengeId, 'postponed');
    
    if (!updatedChallenge) {
      res.status(404);
      throw new Error('Challenge not found');
    }

    res.json({ 
      success: true, 
      message: 'Challenge postponed', 
      challenge: updatedChallenge 
    });
  } catch (error) {
    res.status(500);
    throw new Error('Failed to postpone challenge');
  }
});

export const deleteChallenge = asyncHandler(async (req, res) => {
  const { challengeId } = req.params;
  
  try {
    // First check if challenge exists
    const query = 'DELETE FROM challenges WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [challengeId]);
    
    if (result.rows.length === 0) {
      res.status(404);
      throw new Error('Challenge not found');
    }

    res.json({ 
      success: true, 
      message: 'Challenge deleted' 
    });
  } catch (error) {
    res.status(500);
    throw new Error('Failed to delete challenge');
  }
});