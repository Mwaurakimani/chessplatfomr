import express from 'express'
import { createMatch, validatePlayerController } from '../controllers/challengeController.js'

const router = express.Router()

// POST /api/match
router.post('/', createMatch)

// POST /api/match/validate-player
router.post('/validate-player', validatePlayerController)

export default router
