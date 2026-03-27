const mysql = require('mysql2/promise');
const mongoose = require('mongoose');

class StoredProcedureExecutor {
    constructor(config) {
        this.dbType = config.dbType || 'mysql';
        
        if (this.dbType === 'mysql') {
            this.pool = mysql.createPool(config.mysql);
        } else if (this.dbType === 'mongodb') {
            this.db = config.mongodb;
        }
    }

    async execute(procedureName, parameters) {
        if (this.dbType === 'mysql') {
            return await this.executeMysql(procedureName, parameters);
        } else if (this.dbType === 'mongodb') {
            return await this.executeMongodb(procedureName, parameters);
        }
        
        return { success: false, error: 'Unknown database type' };
    }

    async executeMysql(procedureName, parameters) {
        let connection;
        try {
            connection = await this.pool.getConnection();
            
            const paramStr = parameters && Object.keys(parameters).length > 0
                ? `(${Object.values(parameters).map(v => `'${v}'`).join(',')})`
                : '()';
            
            const query = `CALL ${procedureName}${paramStr}`;
            const [rows] = await connection.query(query);
            
            return {
                success: true,
                data: Array.isArray(rows) ? rows[0] || [] : rows || []
            };
        } catch (error) {
            return { success: false, error: error.message };
        } finally {
            if (connection) connection.release();
        }
    }

    async executeMongodb(procedureName, parameters) {
        try {
            // MongoDB doesn't have traditional stored procedures
            // This would query collections instead
            return { success: true, data: [] };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = StoredProcedureExecutor;
