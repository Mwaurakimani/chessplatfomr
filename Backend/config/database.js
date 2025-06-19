import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    database: "chequemate",
    user: "aerissat",
    password: "root",
    host: "localhost",
    port: 5432
});

export default pool; 