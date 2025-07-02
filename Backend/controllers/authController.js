import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const register = async (req, res) => {
    try {
        const {
            email,
            password,
            username,
            phone,
            name,
            chessComUsername,
            lichessUsername,
            preferredPlatform
        } = req.body;

        // Check if user already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Create new user
        console.log({
            email,
            password,
            username,
            phone,
            name,
            chessComUsername,
            lichessUsername,
            preferredPlatform
        });
        
        const user = await User.create({
            email,
            password,
            username,
            phone,
            name,
            chessComUsername,
            lichessUsername,
            preferredPlatform
        });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                id: user.id,
                email: user.email,
                username: user.username
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering user',
            error: error.message
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }
        // Issue JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, username: user.username },
            process.env.JWT_SECRET || 'supersecretkey',
            { expiresIn: '7d' }
        );
        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                username: user.username
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging in',
            error: error.message
        });
    }
};

export { register, login }; 