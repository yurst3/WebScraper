/* eslint-disable @typescript-eslint/no-unused-vars */
require('dotenv').config();
import { Pool } from 'pg';
import handleRopewikiRegions from "./handleRopewikiRegions"
import handleRopewikiPages from './handleRopewikiPages';

const pool = new Pool({
    host: process.env.DEVELOPMENT_DB_HOST,
    database: process.env.DEVELOPMENT_DB_NAME,
});

(async () => {
    try {
        const regionNameIds: {[name: string]: string} = await handleRopewikiRegions(pool);
        await handleRopewikiPages(pool, regionNameIds);
    } finally {
        await pool.end();
    }
})()