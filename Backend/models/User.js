import pool from '../config/database.js';
import bcrypt from 'bcrypt';

class User {
    static async create(userData) {
        const {
            email,
            password,
            username,
            phone,
            name,
            chessComUsername,
            lichessUsername,
            preferredPlatform
        } = userData;

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        const query = `
            INSERT INTO users (
                email, 
                password, 
                username, 
                phone, 
                name, 
                chess_com_username, 
                lichess_username, 
                preferred_platform,
                created_at
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            RETURNING id, email, username;
        `;

        const values = [
            email,
            hashedPassword,
            username,
            phone,
            name,
            chessComUsername,
            lichessUsername,
            preferredPlatform
        ];

        try {
            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = $1';
        try {
            const result = await pool.query(query, [email]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async findByUsername(username) {
        const query = 'SELECT * FROM users WHERE username = $1';
        try {
            const result = await pool.query(query, [username]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async updateRatingCache(username, ratingData) {
        const { currentRating, chessRatings } = ratingData;
        const query = `
            UPDATE users 
            SET 
                current_rating = $2,
                chess_ratings = $3,
                last_rating_update = NOW(),
                updated_at = NOW()
            WHERE username = $1
            RETURNING *;
        `;
        
        try {
            const result = await pool.query(query, [
                username,
                currentRating,
                JSON.stringify(chessRatings)
            ]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async findById(id) {
        const query = 'SELECT * FROM users WHERE id = $1';
        try {
            const result = await pool.query(query, [id]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async findAvailableOpponents(preferredPlatform, excludeUserId = null) {
        let query = `
            SELECT id, username, name, chess_com_username, lichess_username, preferred_platform, slogan
            FROM users 
            WHERE preferred_platform = $1
        `;
        const values = [preferredPlatform];
        
        if (excludeUserId) {
            query += ` AND id != $2`;
            values.push(excludeUserId);
        }
        
        query += ` ORDER BY created_at DESC`;
        
        try {
            const result = await pool.query(query, values);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    static async findById(userId) {
        const query = `SELECT * FROM users WHERE id = $1`;
        
        try {
            const result = await pool.query(query, [userId]);
            return result.rows[0] || null;
        } catch (error) {
            throw error;
        }
    }

    static async updateProfile(userId, profileData) {
        const { name, phone, chessComUsername, lichessUsername, preferredPlatform } = profileData;
        
        const query = `
            UPDATE users 
            SET 
                name = COALESCE($2, name),
                phone = COALESCE($3, phone),
                chess_com_username = COALESCE($4, chess_com_username),
                lichess_username = COALESCE($5, lichess_username),
                preferred_platform = COALESCE($6, preferred_platform),
                updated_at = NOW()
            WHERE id = $1
            RETURNING *;
        `;
        
        try {
            const result = await pool.query(query, [
                userId,
                name,
                phone, 
                chessComUsername,
                lichessUsername,
                preferredPlatform
            ]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }
}

export default User;
