const config = require('./config/config')
const env = process.env.NODE_ENV || 'development';
const { Client } = require('pg');

const client = new Client({
    host: config[env].host,
    user: config[env].username,
    password: config[env].password,
    port: config[env].port,
    // ssl:true
});

module.exports.createDB = async () => {
    try {
        await client.connect();
        var dbStr = 'CREATE DATABASE '+ config[env].database
        console.log("Connected...", dbStr);                            // gets connection
        await client.query(dbStr); // sends queries
        return true;
    } catch (error) {
        console.error("\n\n Error ", error.stack);
        return false;
    } finally {
        await client.end();                                // closes connection
    }
};