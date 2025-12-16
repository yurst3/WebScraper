import { describe, it, expect, afterEach, jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import getRopewikiPageRevisionDate from '../getRopewikiPageRevisionDate';

const fixturePath = path.join(__dirname, 'data', 'regions', 'ropewikiRegionsRevisionRespons.json');
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));

type MockFetch = ReturnType<typeof jest.fn<typeof fetch>>;

describe('getRopewikiPageRevisionDate', () => {
    afterEach(() => {
        const mockFetch = globalThis.fetch as MockFetch | undefined;
        if (mockFetch && typeof mockFetch.mockClear === 'function') {
            mockFetch.mockClear();
        }
        // @ts-expect-error clear test double
        globalThis.fetch = undefined;
    });

    it('returns Date when fetch succeeds', async () => {
        const pageId = 5597;
        const mockFetch = jest.fn<typeof fetch>().mockResolvedValue({
            ok: true,
            status: 200,
            statusText: 'OK',
            json: async () => fixture,
        } as Response);
        globalThis.fetch = mockFetch as unknown as typeof fetch;

        const date = await getRopewikiPageRevisionDate(pageId);

        const expectedDate = new Date('2023-09-08T17:51:54Z');
        expect(date).toEqual(expectedDate);
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('throws when fetch returns an error status', async () => {
        const pageId = 5597;
        const mockFetch = jest.fn<typeof fetch>().mockResolvedValue({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
        } as Response);
        globalThis.fetch = mockFetch as unknown as typeof fetch;

        await expect(getRopewikiPageRevisionDate(pageId)).rejects.toThrow(
            'Error getting page revision date: 500 Internal Server Error'
        );
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('throws when fetch itself rejects', async () => {
        const pageId = 5597;
        const mockFetch = jest.fn<typeof fetch>().mockRejectedValue(new Error('network failure'));
        globalThis.fetch = mockFetch as unknown as typeof fetch;

        await expect(getRopewikiPageRevisionDate(pageId)).rejects.toThrow(
            'Error getting page revision date: Error: network failure'
        );
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });
});

