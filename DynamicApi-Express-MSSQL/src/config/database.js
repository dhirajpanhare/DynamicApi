const sql = require('mssql');
const dotenv = require('dotenv');

dotenv.config();

// Support both direct DB_ variables and PROD_ prefixed for production
const isProduction = process.env.NODE_ENV === 'production';

const config = {
    server: process.env[isProduction ? 'PROD_DB_HOST' : 'DB_HOST'] || '127.0.0.1',
    port: parseInt(process.env[isProduction ? 'PROD_DB_PORT' : 'DB_PORT']) || 1433,
    database: process.env[isProduction ? 'PROD_DB_NAME' : 'DB_NAME'] || 'DynamicApiDb',
    user: process.env[isProduction ? 'PROD_DB_USER' : 'DB_USER'] || 'sa',
    password: process.env[isProduction ? 'PROD_DB_PASSWORD' : 'DB_PASSWORD'],
    options: {
        trustServerCertificate: process.env[isProduction ? 'PROD_DB_TRUST_SERVER_CERT' : 'DB_TRUST_SERVER_CERT'] !== 'false',
        encrypt: process.env[isProduction ? 'PROD_DB_ENCRYPT' : 'DB_ENCRYPT'] === 'true',
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
