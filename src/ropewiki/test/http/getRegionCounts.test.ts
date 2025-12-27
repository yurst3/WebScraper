import { describe, it, expect, afterEach, jest } from '@jest/globals';
import getRegionCounts from '../../http/getRegionCounts';

type MockFetch = ReturnType<typeof jest.fn<typeof fetch>>;

describe('getRegionCounts', () => {
    afterEach(() => {
        const mockFetch = globalThis.fetch as MockFetch | undefined;
        if (mockFetch && typeof mockFetch.mockClear === 'function') {
            mockFetch.mockClear();
        }
        // @ts-expect-error clear test double
        globalThis.fetch = undefined;
    });

    it('returns region counts for less than 30 regions', async () => {
        const regionNames = ['World', 'Africa', 'Asia'];
        const mockResponse = '(144);(290);(709)';

        const mockFetch = jest.fn<typeof fetch>().mockResolvedValue({
            ok: true,
            status: 200,
            statusText: 'OK',
            text: async () => mockResponse,
        } as Response);
        globalThis.fetch = mockFetch as unknown as typeof fetch;

        const result = await getRegionCounts(regionNames);

        expect(result).toEqual({
            'World': 144,
            'Africa': 290,
            'Asia': 709,
        });
        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('region='));
    });

    it('returns region counts for more than 30 regions (tests chunking)', async () => {
        const regionNames = Array.from({ length: 35 }, (_, i) => `Region${i + 1}`);
        const mockResponse1 = Array.from({ length: 30 }, (_, i) => `(${100 + i})`).join(';');
        const mockResponse2 = Array.from({ length: 5 }, (_, i) => `(${200 + i})`).join(';');

        const mockFetch = jest.fn<typeof fetch>()
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                statusText: 'OK',
                text: async () => mockResponse1,
            } as Response)
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                statusText: 'OK',
                text: async () => mockResponse2,
            } as Response);
        globalThis.fetch = mockFetch as unknown as typeof fetch;

        const result = await getRegionCounts(regionNames);

        expect(Object.keys(result)).toHaveLength(35);
        expect(result['Region1']).toBe(100);
        expect(result['Region30']).toBe(129);
        expect(result['Region31']).toBe(200);
        expect(result['Region35']).toBe(204);
        expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('throws an error when region count does not match number of names in a chunk', async () => {
        const regionNames = ['World', 'Africa', 'Asia'];
        const mockResponse = '(144);(290)'; // Only 2 counts for 3 regions

        const mockFetch = jest.fn<typeof fetch>().mockResolvedValue({
            ok: true,
            status: 200,
            statusText: 'OK',
            text: async () => mockResponse,
        } as Response);
        globalThis.fetch = mockFetch as unknown as typeof fetch;

        await expect(getRegionCounts(regionNames)).rejects.toThrow(
            'Error getting region counts: Expected 3 region counts but got 2'
        );
    });

    it('throws an error when response does not match the regex pattern', async () => {
        const regionNames = ['World', 'Africa'];
        const mockResponse = 'Invalid response format without parentheses';

        const mockFetch = jest.fn<typeof fetch>().mockResolvedValue({
            ok: true,
            status: 200,
            statusText: 'OK',
            text: async () => mockResponse,
        } as Response);
        globalThis.fetch = mockFetch as unknown as typeof fetch;

        await expect(getRegionCounts(regionNames)).rejects.toThrow(
            'Error getting region counts: Expected 2 region counts but got 0'
        );
    });

    it('throws an error when ropewiki returns a non-200 response', async () => {
        const regionNames = ['World', 'Africa'];

        const mockFetch = jest.fn<typeof fetch>().mockResolvedValue({
            ok: false,
            status: 404,
            statusText: 'Not Found',
            text: async () => 'Not Found',
        } as Response);
        globalThis.fetch = mockFetch as unknown as typeof fetch;

        await expect(getRegionCounts(regionNames)).rejects.toThrow(
            'Error getting region counts: 404 Not Found'
        );
    });

    it('throws an error when fetch() throws an error', async () => {
        const regionNames = ['World', 'Africa'];
        const fetchError = new Error('Network error');

        const mockFetch = jest.fn<typeof fetch>().mockRejectedValue(fetchError);
        globalThis.fetch = mockFetch as unknown as typeof fetch;

        await expect(getRegionCounts(regionNames)).rejects.toThrow(
            'Error getting region counts: Error: Network error'
        );
    });
});

