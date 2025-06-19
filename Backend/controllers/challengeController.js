import asyncHandler from 'express-async-handler'
import fetch from 'node-fetch'

const CHESS_COM_API = 'https://api.chess.com/pub'
const LICHESS_API   = 'https://lichess.org/api'

/**
 * Returns { valid, data } or { valid:false, error }.
 */
async function validatePlayer(username, platform) {
  let res, name
  if (platform === 'chess.com') {
    name = 'Chess.com'
    res = await fetch(`${CHESS_COM_API}/player/${username.toLowerCase()}`)
  } else {
    name = 'Lichess.org'
    res = await fetch(`${LICHESS_API}/user/${username}`)
  }

  if (res.status === 200) {
    return { valid: true, data: await res.json() }
  }
  if (res.status === 404) {
    return { valid: false, error: `Player "${username}" not found on ${name}` }
  }
  return { valid: false, error: `Error ${res.status} checking "${username}" on ${name}` }
}

/**
 * POST /api/match
 * Body: { player1, player2, platform }
 * Response: { player1Url, player2Url }
 */
export const createMatch = asyncHandler(async (req, res) => {
  const { player1, player2, platform } = req.body

  if (!player1 || !player2 || !platform) {
    res.status(400)
    throw new Error('player1, player2 and platform are required')
  }
  if (player1.toLowerCase() === player2.toLowerCase()) {
    res.status(400)
    throw new Error('player1 and player2 must differ')
  }

  // validate both
  const [r1, r2] = await Promise.all([
    validatePlayer(player1, platform),
    validatePlayer(player2, platform)
  ])
  if (!r1.valid) {
    res.status(404)
    throw new Error(r1.error)
  }
  if (!r2.valid) {
    res.status(404)
    throw new Error(r2.error)
  }

  // build URLs
  let player1Url, player2Url
  if (platform === 'chess.com') {
    player1Url = `https://www.chess.com/play/online/new?opponent=${player2.toLowerCase()}`
    player2Url = `https://www.chess.com/play/online/new?opponent=${player1.toLowerCase()}`
  } else {
    player1Url = `https://lichess.org/?user=${player2.toLowerCase()}#friend`
    player2Url = `https://lichess.org/?user=${player1.toLowerCase()}#friend`
  }

  res.json({ player1Url, player2Url })
})

export const validatePlayerController = asyncHandler(async (req, res) => {
  const { username, platform } = req.body;
  if (!username || !platform) {
    res.status(400);
    throw new Error('username and platform are required');
  }
  const result = await validatePlayer(username, platform);
  res.json(result);
});
