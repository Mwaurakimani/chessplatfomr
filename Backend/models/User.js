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
}

export default User;
