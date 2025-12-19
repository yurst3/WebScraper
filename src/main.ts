/* eslint-disable @typescript-eslint/no-unused-vars */
require('dotenv').config();
import { Pool } from 'pg';
import handleRopewikiRegions from "./handleRopewikiRegions"

const pool = new Pool({
    host: process.env.DEVELOPMENT_DB_HOST,
    database: process.env.DEVELOPMENT_DB_NAME,
});

(async () => {
    try {
        await handleRopewikiRegions(pool);
    } finally {
        await pool.end();
    }
})()