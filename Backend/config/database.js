import 'dotenv/config';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    database: "chequemate",
    user: "avnadmin",
    password: "AVNS_KY97oCF7I1z8WXQ6_gm",
    host: "chequemate-service-chequemate-db.g.aivencloud.com",
    port: 20381,
    ssl: {
        rejectUnauthorized: false,
    }
});

export default pool;
