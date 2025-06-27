import express from 'express'
import dotenv from 'dotenv'
import matchRoutes from './routes/challengeRoutes.js'  // we'll repurpose this
import cors from 'cors'
import authRoutes from './routes/auth.js'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'

dotenv.config()

const app = express()
const server = http.createServer(app)
const io = new SocketIOServer(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
})

// In-memory store for online users
let onlineUsers = {}
// In-memory store for challenges (for demo; use DB in production)
let challenges = []

io.on('connection', (socket) => {
    // Listen for user identification
    socket.on('user-online', (user) => {
        onlineUsers[socket.id] = { ...user, socketId: socket.id };
        io.emit('online-users', Object.values(onlineUsers));
        // Also send the user their current challenges
        const userChallenges = challenges.filter(c => c.from.id === user.id || c.to.id === user.id);
        socket.emit('challenges-update', userChallenges);
    });

    // Handle challenge event
    socket.on('challenge', (data) => {
        // Store challenge (for demo; use DB in production)
        challenges.push({
            from: data.from,
            to: data.to,
            timestamp: data.timestamp,
            status: 'pending'
        })
        // Notify the challenged user if online
        const targetSocket = Object.values(onlineUsers).find(u => u.id === data.to.id)
        if (targetSocket && targetSocket.socketId) {
            io.to(targetSocket.socketId).emit('challenge-received', {
                from: data.from,
                timestamp: data.timestamp
            })
        }
        // Notify the challenger (for outgoing requests)
        socket.emit('challenge-sent', {
            to: data.to,
            timestamp: data.timestamp
        })
        // Optionally, broadcast updated challenges to both users
        io.to(socket.id).emit('challenges-update', challenges.filter(c => c.from.id === data.from.id || c.to.id === data.from.id))
        if (targetSocket && targetSocket.socketId) {
            io.to(targetSocket.socketId).emit('challenges-update', challenges.filter(c => c.from.id === data.to.id || c.to.id === data.to.id))
        }
    })

    // Accept/decline challenge events
    socket.on('challenge-accept', (data) => {
        // Find the challenge in memory and update status
        const idx = challenges.findIndex(c => c.from.id === data.from.id && c.to.id === data.to.id && c.timestamp === data.timestamp);
        if (idx !== -1) {
            challenges[idx].status = 'accepted';
            // Notify challenger
            const challengerSocket = Object.values(onlineUsers).find(u => u.id === data.from.id);
            const challengedSocket = Object.values(onlineUsers).find(u => u.id === data.to.id);

            if (challengerSocket && challengerSocket.socketId && challengedSocket && challengedSocket.socketId) {
                const challengeData = {
                    from: {
                        id: data.from.id,
                        name: data.from.name,
                        username: data.from.username,
                        chessComUsername: challengerSocket.chessComUsername,
                        lichessUsername: challengerSocket.lichessUsername,
                        preferredPlatform: challengerSocket.preferredPlatform
                    },
                    to: {
                        id: data.to.id,
                        name: data.to.name,
                        username: data.to.username,
                        chessComUsername: challengedSocket.chessComUsername,
                        lichessUsername: challengedSocket.lichessUsername,
                        preferredPlatform: challengedSocket.preferredPlatform
                    },
                    timestamp: data.timestamp,
                    platform: data.platform // This platform is the one the challenged user accepted on
                };
                io.to(challengerSocket.socketId).emit('challenge-accepted', challengeData);
                io.to(challengedSocket.socketId).emit('challenge-accepted', challengeData); // Also send to the challenged user for redirection

                // Broadcast updated challenges to both users
                io.to(challengerSocket.socketId).emit('challenges-update', challenges.filter(c => c.from.id === data.from.id || c.to.id === data.from.id));
                io.to(challengedSocket.socketId).emit('challenges-update', challenges.filter(c => c.from.id === data.to.id || c.to.id === data.to.id));
            }
        }
    });
    socket.on('challenge-decline', (data) => {
        // Remove challenge from memory
        const idx = challenges.findIndex(c => c.from.id === data.from.id && c.to.id === data.to.id && c.timestamp === data.timestamp);
        if (idx !== -1) {
            challenges.splice(idx, 1);
            // Notify challenger
            const challengerSocket = Object.values(onlineUsers).find(u => u.id === data.from.id);
            const challengedSocket = Object.values(onlineUsers).find(u => u.id === data.to.id);

            if (challengerSocket && challengerSocket.socketId) {
                io.to(challengerSocket.socketId).emit('challenge-declined', {
                    from: data.from,
                    to: data.to,
                    timestamp: data.timestamp
                });
            }

            // Broadcast updated challenges to both users
            if (challengerSocket && challengerSocket.socketId) {
                io.to(challengerSocket.socketId).emit('challenges-update', challenges.filter(c => c.from.id === data.from.id || c.to.id === data.from.id));
            }
            if (challengedSocket && challengedSocket.socketId) {
                io.to(challengedSocket.socketId).emit('challenges-update', challenges.filter(c => c.from.id === data.to.id || c.to.id === data.to.id));
            }
        }
    });

    socket.on('disconnect', () => {
        delete onlineUsers[socket.id]
        io.emit('online-users', Object.values(onlineUsers))
    })
})

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/match', matchRoutes)
app.use('/api/auth', authRoutes)

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: err.message
    })
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`))
