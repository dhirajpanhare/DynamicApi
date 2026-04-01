const sql = require('mssql');
const dotenv = require('dotenv');

dotenv.config();

const config = {
    server: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 1433,
    database: process.env.DB_NAME || 'DynamicApiDb',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD,
    options: {
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERT !== 'false',
        encrypt: process.env.DB_ENCRYPT === 'true',
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

let pool = null;

async function getPool() {
    if (!pool) {
        pool = await sql.connect(config);
    }
    return pool;
}

module.exports = { getPool, sql };
