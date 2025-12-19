import { describe, it, expect, afterEach, jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import getRopewikiPagesRevisionDates from '../../http/getRopewikiPageRevisionDate';

const fixturePath = path.join(__dirname, '..', 'data', 'regions', 'ropewikiRegionsRevisionRespons.json');
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));

type MockFetch = ReturnType<typeof jest.fn<typeof fetch>>;

describe('getRopewikiPagesRevisionDates', () => {
    afterEach(() => {
        const mockFetch = globalThis.fetch as MockFetch | undefined;
        if (mockFetch && typeof mockFetch.mockClear === 'function') {
            mockFetch.mockClear();
        }
        // @ts-expect-error clear test double
        globalThis.fetch = undefined;
    });

    it('returns Mapping of pageId to Date when fetch succeeds', async () => {
        const pageIds = ['5597'];
        const mockFetch = jest.fn<typeof fetch>().mockResolvedValue({
            ok: true,
            status: 200,
            statusText: 'OK',
            json: async () => fixture,
        } as Response);
        globalThis.fetch = mockFetch as unknown as typeof fetch;

        const result = await getRopewikiPagesRevisionDates(pageIds);

        const expectedDate = new Date('2023-09-08T17:51:54Z');
        expect(Object.keys(result).length).toBe(1);
        expect(result['5597']).toEqual(expectedDate);
        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('pageids=5597'));
    });

    it('returns Map with multiple pageIds when fetch succeeds', async () => {
        const pageIds = ['5597', '728'];
        const multiPageFixture = {
            ...fixture,
            query: {
                ...fixture.query,
                pages: {
                    ...fixture.query.pages,
                    '728': {
                        pageid: 728,
                        ns: 0,
                        title: 'Bear Creek Canyon',
                        revisions: [
                            {
                                revid: 123456,
                                parentid: 123455,
                                user: 'TestUser',
                                timestamp: '2024-01-15T10:30:00Z',
                                comment: ''
                            }
                        ]
                    }
                }
            }
        };
        const mockFetch = jest.fn<typeof fetch>().mockResolvedValue({
            ok: true,
            status: 200,
            statusText: 'OK',
            json: async () => multiPageFixture,
        } as Response);
        globalThis.fetch = mockFetch as unknown as typeof fetch;

        const result = await getRopewikiPagesRevisionDates(pageIds);

        expect(Object.keys(result).length).toBe(2);
        expect(result['5597']).toEqual(new Date('2023-09-08T17:51:54Z'));
        expect(result['728']).toEqual(new Date('2024-01-15T10:30:00Z'));
        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('pageids=5597|728'));
    });

    it('throws when fetch returns an error status', async () => {
        const pageIds = ['5597'];
        const mockFetch = jest.fn<typeof fetch>().mockResolvedValue({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
        } as Response);
        globalThis.fetch = mockFetch as unknown as typeof fetch;

        await expect(getRopewikiPagesRevisionDates(pageIds)).rejects.toThrow(
            'Error getting page revision date: 500 Internal Server Error'
        );
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('throws when fetch itself rejects', async () => {
        const pageIds = ['5597'];
        const mockFetch = jest.fn<typeof fetch>().mockRejectedValue(new Error('network failure'));
        globalThis.fetch = mockFetch as unknown as typeof fetch;

        await expect(getRopewikiPagesRevisionDates(pageIds)).rejects.toThrow(
            'Error getting page revision date: Error: network failure'
        );
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });
});

