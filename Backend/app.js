import express from 'express'
import dotenv from 'dotenv'
import matchRoutes from './routes/challengeRoutes.js'  // we’ll repurpose this

dotenv.config()

const app = express()
app.use(express.json())

// … your existing /api/users, /api/challenges, etc.

// New “create match” endpoint:
app.use('/api/match', matchRoutes)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server listening on ${PORT}`))
