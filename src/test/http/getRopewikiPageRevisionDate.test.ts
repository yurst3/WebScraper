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

    it('makes single API call when pageIds count is exactly 50', async () => {
        const pageIds = Array.from({ length: 50 }, (_, i) => String(i + 1));
        const fixtureWith50Pages: typeof fixture = {
            ...fixture,
            query: {
                ...fixture.query,
                pages: Object.fromEntries(
                    pageIds.map((pageId) => [
                        pageId,
                        {
                            pageid: Number(pageId),
                            ns: 0,
                            title: `Page ${pageId}`,
                            revisions: [
                                {
                                    revid: 123456,
                                    parentid: 123455,
                                    user: 'TestUser',
                                    timestamp: `2024-01-${String(Number(pageId) % 28 + 1).padStart(2, '0')}T10:00:00Z`,
                                    comment: ''
                                }
                            ]
                        }
                    ])
                )
            }
        };

        const mockFetch = jest.fn<typeof fetch>().mockResolvedValue({
            ok: true,
            status: 200,
            statusText: 'OK',
            json: async () => fixtureWith50Pages,
        } as Response);
        globalThis.fetch = mockFetch as unknown as typeof fetch;

        const result = await getRopewikiPagesRevisionDates(pageIds);

        expect(Object.keys(result).length).toBe(50);
        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining(`pageids=${pageIds.join('|')}`));
    });

    it('makes multiple API calls when pageIds count exceeds 50', async () => {
        const pageIds = Array.from({ length: 51 }, (_, i) => String(i + 1));
        
        // Create fixtures for each chunk
        const createFixtureForChunk = (chunkPageIds: string[]) => ({
            ...fixture,
            query: {
                ...fixture.query,
                pages: Object.fromEntries(
                    chunkPageIds.map((pageId) => [
                        pageId,
                        {
                            pageid: Number(pageId),
                            ns: 0,
                            title: `Page ${pageId}`,
                            revisions: [
                                {
                                    revid: 123456,
                                    parentid: 123455,
                                    user: 'TestUser',
                                    timestamp: `2024-01-${String(Number(pageId) % 28 + 1).padStart(2, '0')}T10:00:00Z`,
                                    comment: ''
                                }
                            ]
                        }
                    ])
                )
            }
        });

        const firstChunk = pageIds.slice(0, 50);
        const secondChunk = pageIds.slice(50);

        const mockFetch = jest.fn<typeof fetch>()
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                statusText: 'OK',
                json: async () => createFixtureForChunk(firstChunk),
            } as Response)
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                statusText: 'OK',
                json: async () => createFixtureForChunk(secondChunk),
            } as Response);
        globalThis.fetch = mockFetch as unknown as typeof fetch;

        const result = await getRopewikiPagesRevisionDates(pageIds);

        expect(Object.keys(result).length).toBe(51);
        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(mockFetch).toHaveBeenNthCalledWith(1, expect.stringContaining(`pageids=${firstChunk.join('|')}`));
        expect(mockFetch).toHaveBeenNthCalledWith(2, expect.stringContaining(`pageids=${secondChunk.join('|')}`));
    });

    it('makes multiple API calls for 100 pageIds (2 chunks)', async () => {
        const pageIds = Array.from({ length: 100 }, (_, i) => String(i + 1));
        
        const createFixtureForChunk = (chunkPageIds: string[]) => ({
            ...fixture,
            query: {
                ...fixture.query,
                pages: Object.fromEntries(
                    chunkPageIds.map((pageId) => [
                        pageId,
                        {
                            pageid: Number(pageId),
                            ns: 0,
                            title: `Page ${pageId}`,
                            revisions: [
                                {
                                    revid: 123456,
                                    parentid: 123455,
                                    user: 'TestUser',
                                    timestamp: `2024-01-${String(Number(pageId) % 28 + 1).padStart(2, '0')}T10:00:00Z`,
                                    comment: ''
                                }
                            ]
                        }
                    ])
                )
            }
        });

        const firstChunk = pageIds.slice(0, 50);
        const secondChunk = pageIds.slice(50);

        const mockFetch = jest.fn<typeof fetch>()
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                statusText: 'OK',
                json: async () => createFixtureForChunk(firstChunk),
            } as Response)
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                statusText: 'OK',
                json: async () => createFixtureForChunk(secondChunk),
            } as Response);
        globalThis.fetch = mockFetch as unknown as typeof fetch;

        const result = await getRopewikiPagesRevisionDates(pageIds);

        expect(Object.keys(result).length).toBe(100);
        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(mockFetch).toHaveBeenNthCalledWith(1, expect.stringContaining(`pageids=${firstChunk.join('|')}`));
        expect(mockFetch).toHaveBeenNthCalledWith(2, expect.stringContaining(`pageids=${secondChunk.join('|')}`));
    });

    it('makes multiple API calls for 101 pageIds (3 chunks)', async () => {
        const pageIds = Array.from({ length: 101 }, (_, i) => String(i + 1));
        
        const createFixtureForChunk = (chunkPageIds: string[]) => ({
            ...fixture,
            query: {
                ...fixture.query,
                pages: Object.fromEntries(
                    chunkPageIds.map((pageId) => [
                        pageId,
                        {
                            pageid: Number(pageId),
                            ns: 0,
                            title: `Page ${pageId}`,
                            revisions: [
                                {
                                    revid: 123456,
                                    parentid: 123455,
                                    user: 'TestUser',
                                    timestamp: `2024-01-${String(Number(pageId) % 28 + 1).padStart(2, '0')}T10:00:00Z`,
                                    comment: ''
                                }
                            ]
                        }
                    ])
                )
            }
        });

        const firstChunk = pageIds.slice(0, 50);
        const secondChunk = pageIds.slice(50, 100);
        const thirdChunk = pageIds.slice(100);

        const mockFetch = jest.fn<typeof fetch>()
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                statusText: 'OK',
                json: async () => createFixtureForChunk(firstChunk),
            } as Response)
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                statusText: 'OK',
                json: async () => createFixtureForChunk(secondChunk),
            } as Response)
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                statusText: 'OK',
                json: async () => createFixtureForChunk(thirdChunk),
            } as Response);
        globalThis.fetch = mockFetch as unknown as typeof fetch;

        const result = await getRopewikiPagesRevisionDates(pageIds);

        expect(Object.keys(result).length).toBe(101);
        expect(mockFetch).toHaveBeenCalledTimes(3);
        expect(mockFetch).toHaveBeenNthCalledWith(1, expect.stringContaining(`pageids=${firstChunk.join('|')}`));
        expect(mockFetch).toHaveBeenNthCalledWith(2, expect.stringContaining(`pageids=${secondChunk.join('|')}`));
        expect(mockFetch).toHaveBeenNthCalledWith(3, expect.stringContaining(`pageids=${thirdChunk.join('|')}`));
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

    it('throws when fetch returns an error status in a chunked request', async () => {
        const pageIds = Array.from({ length: 51 }, (_, i) => String(i + 1));
        const firstChunk = pageIds.slice(0, 50);
        const createFixtureForChunk = (chunkPageIds: string[]) => ({
            ...fixture,
            query: {
                ...fixture.query,
                pages: Object.fromEntries(
                    chunkPageIds.map((pageId) => [
                        pageId,
                        {
                            pageid: Number(pageId),
                            ns: 0,
                            title: `Page ${pageId}`,
                            revisions: [
                                {
                                    revid: 123456,
                                    parentid: 123455,
                                    user: 'TestUser',
                                    timestamp: `2024-01-01T10:00:00Z`,
                                    comment: ''
                                }
                            ]
                        }
                    ])
                )
            }
        });

        const mockFetch = jest.fn<typeof fetch>()
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                statusText: 'OK',
                json: async () => createFixtureForChunk(firstChunk),
            } as Response)
            .mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
            } as Response);
        globalThis.fetch = mockFetch as unknown as typeof fetch;

        await expect(getRopewikiPagesRevisionDates(pageIds)).rejects.toThrow(
            'Error getting page revision date: 500 Internal Server Error'
        );
        expect(mockFetch).toHaveBeenCalledTimes(2);
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

    it('throws when fetch rejects in a chunked request', async () => {
        const pageIds = Array.from({ length: 51 }, (_, i) => String(i + 1));
        const firstChunk = pageIds.slice(0, 50);
        const createFixtureForChunk = (chunkPageIds: string[]) => ({
            ...fixture,
            query: {
                ...fixture.query,
                pages: Object.fromEntries(
                    chunkPageIds.map((pageId) => [
                        pageId,
                        {
                            pageid: Number(pageId),
                            ns: 0,
                            title: `Page ${pageId}`,
                            revisions: [
                                {
                                    revid: 123456,
                                    parentid: 123455,
                                    user: 'TestUser',
                                    timestamp: `2024-01-01T10:00:00Z`,
                                    comment: ''
                                }
                            ]
                        }
                    ])
                )
            }
        });

        const mockFetch = jest.fn<typeof fetch>()
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                statusText: 'OK',
                json: async () => createFixtureForChunk(firstChunk),
            } as Response)
            .mockRejectedValueOnce(new Error('network failure'));
        globalThis.fetch = mockFetch as unknown as typeof fetch;

        await expect(getRopewikiPagesRevisionDates(pageIds)).rejects.toThrow(
            'Error getting page revision date: Error: network failure'
        );
        expect(mockFetch).toHaveBeenCalledTimes(2);
    });
});

