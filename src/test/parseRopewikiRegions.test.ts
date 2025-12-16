import { describe, it, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import parseRegionsHtml from '../parseRopewikiRegions';

describe('parseRegionsHtml', () => {
    it('should parse regions.html and match regions.json', async () => {
        const htmlPath = path.join(__dirname, 'data', 'regions', 'regions.html');
        const expectedRegions = require('./data/regions/regions.json');
        
        const html = fs.readFileSync(htmlPath, 'utf-8'); // This file shouldn't have any formatting
        
        const result = await parseRegionsHtml(html);
        
        expect(result).toEqual(expectedRegions);
    }, 30000); // Increase timeout to 30 seconds for puppeteer
});

