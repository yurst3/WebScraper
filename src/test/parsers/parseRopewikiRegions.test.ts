import { describe, it, expect, jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';

// Mock uuid to avoid Jest ESM parsing issues while keeping deterministic IDs for tests
jest.mock('uuid', () => ({
    v5: (value: string, namespace: string): string => value,
}));

import parseRegionsHtml from '../../parsers/parseRopewikiRegions';

describe('parseRegionsHtml', () => {
    it('should parse regions.html and match regions.json', async () => {
        const htmlPath = path.join(__dirname, '..', 'data', 'regions', 'regions.html');
        const expectedRegionsPath = path.join(__dirname, '..', 'data', 'regions', 'regionsMockData.json');

        const html = fs.readFileSync(htmlPath, 'utf-8'); // This file shouldn't have any formatting
        const expectedRegions = JSON.parse(fs.readFileSync(expectedRegionsPath, 'utf-8'));

        const result = await parseRegionsHtml(html);

        expect(result).toEqual(expectedRegions);
    }, 30000); // Increase timeout to 30 seconds for puppeteer
});

