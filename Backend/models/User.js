import pool from '../config/database.js'; // Ensure this path is correct for your mysql2 pool
import bcrypt from 'bcrypt';

class User {
    static async create(userData) {
        const {
            email,
            password, // This password should already be plain text here, hashed below
            username,
            phone,
            chessComUsername,
            lichessUsername,
            preferredPlatform
        } = userData;

        console.log(userData)

        // Hash the password - This part is correct and crucial for security
        const hashedPassword = await bcrypt.hash(password, 10);

        // MariaDB/MySQL INSERT query with '?' placeholders
        // Removed RETURNING clause and NOW() for created_at (relying on table default)
        const query = `
            INSERT INTO users (
                email,
                password,
                username,
                phone,
                chess_com_username,
                lichess_username,
                preferred_platform
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            email,
            hashedPassword,
            username,
            phone,
            chessComUsername || null, // Handle optional fields
            lichessUsername || null,
            preferredPlatform
        ];

        console.log(values);

        try {
            // Using pool.execute() for parameterized queries with mysql2
            // For INSERT, the result object will contain insertId
            const [result] = await pool.execute(query, values);

            // Construct the user object to return, including the newly generated ID
            return {
                id: result.insertId, // Get the auto-generated ID from MariaDB
                email: email,
                username: username
                // You can add other fields from userData if needed by the controller
            };
        } catch (error) {
            console.error('Error in User.create:', error);
            // Re-throw the error so the controller can handle it (e.g., duplicate entry)
            throw error;
        }
    }

    static async findByEmail(email) {
        // MariaDB/MySQL SELECT query with '?' placeholder
        const query = 'SELECT * FROM users WHERE email = ?';
        try {
            // Using pool.execute() for parameterized queries with mysql2
            // It returns an array: [rows, fields]
            const [rows] = await pool.execute(query, [email]);
            return rows[0] || null; // Return the first row found or null if none
        } catch (error) {
            console.error('Error in User.findByEmail:', error);
            throw error;
        }
    }
}

export default User;