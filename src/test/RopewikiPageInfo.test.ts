import { describe, it, expect } from '@jest/globals';
import RopewikiPageInfo from '../types/ropewiki';

describe('RopewikiPageInfo', () => {
    it('sets isValid to false when required fields are missing', () => {
        const invalidRawData = {
            printouts: {
                pageid: [], // Missing required field
                name: ['Invalid Page'],
                region: [],
                url: [],
            },
        };

        const pageInfo = new RopewikiPageInfo(invalidRawData);

        expect(pageInfo.isValid).toBe(false);
        expect(pageInfo.pageid).toBe('');
        expect(pageInfo.name).toBe('Invalid Page');
        expect(pageInfo.region).toBe('');
        expect(pageInfo.url).toBe('');
    });

    it('sets isValid to false when name is missing', () => {
        const invalidRawData = {
            printouts: {
                pageid: ['12345'],
                name: [], // Missing required field
                region: [{ fulltext: 'Test Region' }],
                url: ['https://ropewiki.com/test'],
            },
        };

        const pageInfo = new RopewikiPageInfo(invalidRawData);

        expect(pageInfo.isValid).toBe(false);
        expect(pageInfo.pageid).toBe('12345');
        expect(pageInfo.name).toBe('');
    });

    it('sets isValid to false when region is missing', () => {
        const invalidRawData = {
            printouts: {
                pageid: ['12345'],
                name: ['Test Page'],
                region: [], // Missing required field
                url: ['https://ropewiki.com/test'],
            },
        };

        const pageInfo = new RopewikiPageInfo(invalidRawData);

        expect(pageInfo.isValid).toBe(false);
        expect(pageInfo.region).toBe('');
    });

    it('sets isValid to false when url is missing', () => {
        const invalidRawData = {
            printouts: {
                pageid: ['12345'],
                name: ['Test Page'],
                region: [{ fulltext: 'Test Region' }],
                url: [], // Missing required field
            },
        };

        const pageInfo = new RopewikiPageInfo(invalidRawData);

        expect(pageInfo.isValid).toBe(false);
        expect(pageInfo.url).toBe('');
    });

    it('sets isValid to true when all required fields are present', () => {
        const validRawData = {
            printouts: {
                pageid: ['12345'],
                name: ['Test Page'],
                region: [{ fulltext: 'Test Region' }],
                url: ['https://ropewiki.com/test'],
            },
        };

        const pageInfo = new RopewikiPageInfo(validRawData);

        expect(pageInfo.isValid).toBe(true);
        expect(pageInfo.pageid).toBe('12345');
        expect(pageInfo.name).toBe('Test Page');
        expect(pageInfo.region).toBe('Test Region');
        expect(pageInfo.url).toBe('https://ropewiki.com/test');
    });
});

