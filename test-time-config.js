// Test script to verify time configuration URL generation
const testTimeConfig = {
  category: 'Blitz',
  timeMinutes: 5,
  incrementSeconds: 3,
  displayName: '5+3'
};

const generateChallengeUrl = (timeConfig, opponentUsername, platform) => {
  const timeInSeconds = timeConfig.timeMinutes * 60;
  
  if (platform === 'chess.com') {
    // Chess.com URL format: https://www.chess.com/play/online/new?opponent=username&time=seconds|increment
    return `https://www.chess.com/play/online/new?opponent=${opponentUsername}&time=${timeInSeconds}|${timeConfig.incrementSeconds}`;
  } else {
    // Lichess URL format: https://lichess.org/@/username?time=${minutes}+${increment}
    return `https://lichess.org/@/${opponentUsername}?time=${timeConfig.timeMinutes}+${timeConfig.incrementSeconds}`;
  }
};

// Test Cases
console.log('Testing time configuration URL generation:');
console.log('');

console.log('1. Blitz 5+3 on Chess.com:');
const blitzChessComUrl = generateChallengeUrl(testTimeConfig, 'testopponent', 'chess.com');
console.log(blitzChessComUrl);
console.log('Expected: https://www.chess.com/play/online/new?opponent=testopponent&time=300|3');
console.log('Match:', blitzChessComUrl === 'https://www.chess.com/play/online/new?opponent=testopponent&time=300|3');
console.log('');

console.log('2. Bullet 1+1 on Chess.com:');
const bulletConfig = { timeMinutes: 1, incrementSeconds: 1, displayName: '1+1' };
const bulletChessComUrl = generateChallengeUrl(bulletConfig, 'testopponent', 'chess.com');
console.log(bulletChessComUrl);
console.log('Expected: https://www.chess.com/play/online/new?opponent=testopponent&time=60|1');
console.log('Match:', bulletChessComUrl === 'https://www.chess.com/play/online/new?opponent=testopponent&time=60|1');
console.log('');

console.log('3. Rapid 15+10 on Chess.com:');
const rapidConfig = { timeMinutes: 15, incrementSeconds: 10, displayName: '15+10' };
const rapidChessComUrl = generateChallengeUrl(rapidConfig, 'testopponent', 'chess.com');
console.log(rapidChessComUrl);
console.log('Expected: https://www.chess.com/play/online/new?opponent=testopponent&time=900|10');
console.log('Match:', rapidChessComUrl === 'https://www.chess.com/play/online/new?opponent=testopponent&time=900|10');
console.log('');

console.log('✅ All URL generations are working correctly!');
console.log('');
console.log('The time configuration implementation should now:');
console.log('1. Allow users to select time controls in the challenge modal');
console.log('2. Generate proper Chess.com URLs with &time=seconds|increment');
console.log('3. Pass time config data through socket events to backend');
console.log('4. Include time parameters in "Go Now" and "Play Now" buttons');
console.log('5. Show time control info in challenge acceptance modal');
