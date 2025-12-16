import { describe, it, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import parseRopewikiPage from '../parseRopewikiPage';

describe('parseRopewikiPage', () => {
    it('parses Bear Creek Canyon HTML and matches expected beta and images', async () => {
        const htmlPath = path.join(__dirname, 'data', 'bearCreekCanyon', 'bearCreekCanyon.html');
        const expectedBetaPath = path.join(__dirname, 'data', 'bearCreekCanyon', 'bearCreekCanyonBeta.json');
        const expectedImagesPath = path.join(__dirname, 'data', 'bearCreekCanyon', 'bearCreekCanyonImages.json');

        const html = fs.readFileSync(htmlPath, 'utf-8'); // This file shouldn't have any formatting
        const expectedBeta = JSON.parse(fs.readFileSync(expectedBetaPath, 'utf-8'));
        const expectedImages = JSON.parse(fs.readFileSync(expectedImagesPath, 'utf-8'));

        const { beta, images } = await parseRopewikiPage(html);

        expect(beta).toEqual(expectedBeta);
        expect(images).toEqual(expectedImages);
    }, 30000); // Increase timeout to 30 seconds for puppeteer
});


