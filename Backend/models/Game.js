import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema({
  challenge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge',
    required: true
  },
  result: {
    type: String,
    enum: ['1-0', '0-1', '½-½'],
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Game', gameSchema);
