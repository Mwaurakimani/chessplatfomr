import express from 'express';
import dotenv from 'dotenv';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import pool from './config/database.js';
import Challenge from './models/Challenge.js';

import authRoutes from './routes/auth.js';
import challengeRoutes from './routes/challengeRoutes.js';
import gameRoutes from './routes/gameRoutes.js';
import userRoutes from './routes/userRoutes.js';
import matchmakingRoutes from './routes/matchmaking.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.set('socketio', io);

// In-memory store for online users
const onlineUsers = {};
app.set('io', io);
app.set('onlineUsers', onlineUsers);

io.on('connection', (socket) => {
  socket.on('user-online', (user) => {
    if (user && user.id) {
      console.log('User joining room:', user.id, 'with socket:', socket.id);
      socket.join(user.id.toString());
      onlineUsers[socket.id] = { ...user, socketId: socket.id };
      io.emit('online-users', Object.values(onlineUsers));
      
      // Test room functionality by sending a welcome message to the specific user
      setTimeout(() => {
        io.to(user.id.toString()).emit('test-room-message', {
          message: `Welcome ${user.username}! Your socket room is working.`,
          userId: user.id
        });
      }, 1000);
    }
  });

  // Handle challenge events
  socket.on('challenge', async (data) => {
    try {
      const { from, to } = data;
      
      // Create challenge in database
      const challenge = await Challenge.create({
        challenger: from.id,
        opponent: to.id,
        platform: data.platform || 'chess.com', // Default to chess.com if not provided
        time_control: data.time_control || '10+0',
        rules: data.rules || 'chess'
      });

      // Format challenge object to match frontend expectations
      const challengeForFrontend = {
        id: challenge.id,
        challenger: {
          id: from.id,
          username: from.username,
          name: from.name,
          preferred_platform: from.preferred_platform
        },
        opponent: {
          id: to.id,
          username: to.username,
          name: to.name,
          preferred_platform: to.preferred_platform
        },
        platform: challenge.platform,
        time_control: challenge.time_control,
        rules: challenge.rules,
        status: challenge.status,
        createdAt: challenge.created_at
      };

      // Emit to the opponent that they have a new challenge
      console.log('Emitting newChallenge to opponent:', to.id, challengeForFrontend);
      io.to(to.id.toString()).emit('newChallenge', challengeForFrontend);
      
      // Emit to the challenger that their challenge was sent
      console.log('Emitting challengeSent to challenger:', from.id, challengeForFrontend);
      io.to(from.id.toString()).emit('challengeSent', challengeForFrontend);
      
      console.log('Challenge created and emitted:', challengeForFrontend);
    } catch (error) {
      console.error('Error creating challenge:', error);
    }
  });

  // Challenge acceptance is now handled via REST API in challengeController
  // This eliminates duplicate handling and potential confusion

  socket.on('challenge-decline', async (data) => {
    try {
      const { challengeId, challengerId, challengedId } = data;
      
      // Update challenge status in database
      await Challenge.updateStatus(challengeId, 'declined');
      
      // Emit to challenger that challenge was declined
      const declineData = {
        challengeId,
        challengerId,
        challengedId
      };
      
      console.log('Emitting challenge-declined to challenger:', challengerId, declineData);
      io.to(challengerId.toString()).emit('challenge-declined', declineData);
      
      console.log('Challenge declined:', data);
    } catch (error) {
      console.error('Error declining challenge:', error);
    }
  });

  socket.on('challenge-cancel', async (data) => {
    try {
      const { challengeId, challengerId, challengedId } = data;
      
      // Update challenge status in database
      await Challenge.updateStatus(challengeId, 'cancelled');
      
      // Emit to both users that challenge was cancelled
      const cancelData = {
        challengeId,
        challengerId,
        challengedId
      };
      
      console.log('Emitting challenge-cancelled to both users:', cancelData);
      io.to(challengerId.toString()).emit('challenge-cancelled', cancelData);
      io.to(challengedId.toString()).emit('challenge-cancelled', cancelData);
      
      console.log('Challenge cancelled:', data);
    } catch (error) {
      console.error('Error cancelling challenge:', error);
    }
  });

  socket.on('challenge-postpone', async (data) => {
    try {
      const { challengeId, challengerId, challengedId, postponedBy } = data;
      
      // Update challenge status to postponed
      await Challenge.updateStatus(challengeId, 'postponed');
      
      // Add to postponed challenges table
      await pool.query(`
        INSERT INTO postponed_challenges (challenge_id, postponed_by)
        VALUES ($1, $2)
      `, [challengeId, postponedBy]);
      
      // Emit to both users that challenge was postponed
      const postponeData = {
        challengeId,
        challengerId,
        challengedId,
        postponedBy
      };
      
      console.log('Emitting challenge-postponed to both users:', postponeData);
      
      // Send to both challenger and challenged user
      io.to(challengerId.toString()).emit('challenge-postponed', postponeData);
      io.to(challengedId.toString()).emit('challenge-postponed', postponeData);
      
      console.log('Challenge postponed:', data);
    } catch (error) {
      console.error('Error postponing challenge:', error);
    }
  });

  socket.on('game-redirect', async (data) => {
    try {
      const { challengeId, challengerId, challengedId, redirectedBy, platform } = data;
      
      // Get challenge data to find usernames
      const challenges = await Challenge.findByUserId(challengerId);
      const challenge = challenges.find(c => c.id === parseInt(challengeId));
      
      if (challenge) {
        const redirectedUser = redirectedBy === challengerId ? challenge.challenger.username : challenge.opponent.username;
        const otherUserId = redirectedBy === challengerId ? challengedId : challengerId;
        
        const redirectData = {
          challengeId,
          challengerId,
          challengedId,
          redirectedBy,
          redirectedUser,
          platform
        };
        
        console.log('Emitting player-redirected to user:', otherUserId, redirectData);
        
        // Notify specifically the other user that someone has redirected to the platform
        io.to(otherUserId.toString()).emit('player-redirected', redirectData);
        
        console.log('Player redirected to platform:', { challengeId, redirectedUser, platform });
      }
    } catch (error) {
      console.error('Error handling game redirect:', error);
    }
  });

  socket.on('game-start', async (data) => {
    try {
      const { challengeId, challengerId, challengedId, platform } = data;
      
      // Update challenge status in database
      await Challenge.updateStatus(challengeId, 'started');
      
      // Emit to both users that game has started
      const gameStartData = {
        challengeId,
        platform
      };
      
      console.log('Emitting game-started to both users:', gameStartData);
      io.to(challengerId.toString()).emit('game-started', gameStartData);
      io.to(challengedId.toString()).emit('game-started', gameStartData);
      
      console.log('Game started:', data);
    } catch (error) {
      console.error('Error starting game:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    const disconnectedUser = onlineUsers[socket.id];
    if (disconnectedUser) {
      console.log('Disconnected user:', disconnectedUser.username, disconnectedUser.id);
    }
    delete onlineUsers[socket.id];
    io.emit('online-users', Object.values(onlineUsers));
  });
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/users', userRoutes);
app.use('/api/matchmaking', matchmakingRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: err.message,
  });
});

const PORT = process.env.PORT || 3000;

pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  client.query('SELECT NOW()', (err, result) => {
    release();
    if (err) {
      return console.error('Error executing query', err.stack);
    }
    console.log('PostgreSQL connected:', result.rows);
  });
});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
