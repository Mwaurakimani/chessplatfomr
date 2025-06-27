import pg from 'pg';
const { Pool } = pg;

// const pool = new Pool({
//     database: "chequemate",
//     user: "aerissat",
//     password: "root",
//     host: "localhost",
//     port: 5432
// });

const pool = new Pool({
    database: "chequemate",
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    host: "chequemate-service-chequemate-db.g.aivencloud.com",
    port: 20381,
    ssl: {
        rejectUnauthorized: false,  
        // OR, for full validation, download the “CA certificate” from Aiven and do:
        // ca: fs.readFileSync(path.resolve(__dirname, 'aiven-ca.pem')).toString()
    }
});

export default pool;