import express from 'express'
import { createMatch } from '../controllers/challengeController.js'

const router = express.Router()

// POST /api/match
router.post('/', createMatch)

export default router
