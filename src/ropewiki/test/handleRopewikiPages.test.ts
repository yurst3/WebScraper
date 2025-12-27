import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as db from 'zapatos/db';
import handleRopewikiPages from '../handleRopewikiPages';
import RopewikiPageInfo from '../types/ropewiki';

// Mock all dependencies
jest.mock('../http/getRopewikiPageInfoForRegion');
jest.mock('../http/getRopewikiPageRevisionDate');
jest.mock('../database/getUpdatedDatesForPages');
jest.mock('../processPages');

import getRopewikiPageInfoForRegion from '../http/getRopewikiPageInfoForRegion';
import getRopewikiPagesRevisionDates from '../http/getRopewikiPageRevisionDate';
import getUpdatedDatesForPages from '../database/getUpdatedDatesForPages';
import processPages from '../processPages';

const mockGetRopewikiPageInfoForRegion = getRopewikiPageInfoForRegion as jest.MockedFunction<typeof getRopewikiPageInfoForRegion>;
const mockGetRopewikiPagesRevisionDates = getRopewikiPagesRevisionDates as jest.MockedFunction<typeof getRopewikiPagesRevisionDates>;
const mockGetUpdatedDatesForPages = getUpdatedDatesForPages as jest.MockedFunction<typeof getUpdatedDatesForPages>;
const mockProcessPages = processPages as jest.MockedFunction<typeof processPages>;

describe('handleRopewikiPages', () => {
    const mockConn = {} as db.Queryable;
    let consoleLogSpy: ReturnType<typeof jest.spyOn>;
    let consoleErrorSpy: ReturnType<typeof jest.spyOn>;

    beforeEach(() => {
        jest.clearAllMocks();
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    const createValidPage = (pageid: string, name: string, region: string): RopewikiPageInfo => {
        return new RopewikiPageInfo({
            printouts: {
                pageid: [pageid],
                name: [name],
                region: [{ fulltext: region }],
                url: [`https://ropewiki.com/${name.replace(/\s+/g, '_')}`],
            },
        });
    };

    const createInvalidPage = (pageid: string): RopewikiPageInfo => {
        return new RopewikiPageInfo({
            printouts: {
                pageid: [pageid],
                name: [], // Missing name makes it invalid
                region: [],
                url: [],
            },
        });
    };

    it('processes pages when count is under 2000', async () => {
        const regionName = 'Test Region';
        const regionPageCount = 100;
        const regionNameIds = { 'Test Region': 'region-id-123' };

        const page1 = createValidPage('728', 'Page 1', regionName);
        const page2 = createValidPage('5597', 'Page 2', regionName);
        const pages = [page1, page2];

        mockGetRopewikiPageInfoForRegion.mockResolvedValue(pages);
        mockGetRopewikiPagesRevisionDates.mockResolvedValue({
            '728': new Date('2024-01-01T00:00:00Z'),
            '5597': new Date('2024-01-02T00:00:00Z'),
        });
        mockGetUpdatedDatesForPages.mockResolvedValue({
            '728': null,
            '5597': null,
        });
        mockProcessPages.mockResolvedValue(undefined);

        await handleRopewikiPages(mockConn, regionName, regionPageCount, regionNameIds);

        expect(mockGetRopewikiPageInfoForRegion).toHaveBeenCalledTimes(1);
        expect(mockGetRopewikiPageInfoForRegion).toHaveBeenCalledWith(regionName, 0, 2000);
        expect(mockGetRopewikiPagesRevisionDates).toHaveBeenCalledWith(['728', '5597']);
        expect(mockGetUpdatedDatesForPages).toHaveBeenCalledWith(mockConn, ['728', '5597']);
        expect(mockProcessPages).toHaveBeenCalledTimes(1);
        expect(mockProcessPages).toHaveBeenCalledWith(
            mockConn,
            pages,
            {
                '728': new Date('2024-01-01T00:00:00Z'),
                '5597': new Date('2024-01-02T00:00:00Z'),
            },
            regionNameIds
        );
    });

    it('processes pages in chunks when count exceeds 2000', async () => {
        const regionName = 'Test Region';
        const regionPageCount = 3500;
        const regionNameIds = { 'Test Region': 'region-id-123' };

        const chunk1Pages = Array.from({ length: 2000 }, (_, i) => createValidPage(`${i + 1}`, `Page ${i + 1}`, regionName));
        const chunk2Pages = Array.from({ length: 1500 }, (_, i) => createValidPage(`${i + 2001}`, `Page ${i + 2001}`, regionName));

        mockGetRopewikiPageInfoForRegion
            .mockResolvedValueOnce(chunk1Pages)
            .mockResolvedValueOnce(chunk2Pages);

        const chunk1PageIds = chunk1Pages.map(p => p.pageid);
        const chunk2PageIds = chunk2Pages.map(p => p.pageid);

        const chunk1RevisionDates = Object.fromEntries(chunk1PageIds.map(id => [id, new Date('2024-01-01T00:00:00Z')]));
        const chunk2RevisionDates = Object.fromEntries(chunk2PageIds.map(id => [id, new Date('2024-01-01T00:00:00Z')]));

        const chunk1UpdateDates = Object.fromEntries(chunk1PageIds.map(id => [id, null]));
        const chunk2UpdateDates = Object.fromEntries(chunk2PageIds.map(id => [id, null]));

        mockGetRopewikiPagesRevisionDates
            .mockResolvedValueOnce(chunk1RevisionDates)
            .mockResolvedValueOnce(chunk2RevisionDates);

        mockGetUpdatedDatesForPages
            .mockResolvedValueOnce(chunk1UpdateDates)
            .mockResolvedValueOnce(chunk2UpdateDates);

        mockProcessPages.mockResolvedValue(undefined);

        await handleRopewikiPages(mockConn, regionName, regionPageCount, regionNameIds);

        expect(mockGetRopewikiPageInfoForRegion).toHaveBeenCalledTimes(2);
        expect(mockGetRopewikiPageInfoForRegion).toHaveBeenNthCalledWith(1, regionName, 0, 2000);
        expect(mockGetRopewikiPageInfoForRegion).toHaveBeenNthCalledWith(2, regionName, 2000, 2000);
        expect(mockGetRopewikiPagesRevisionDates).toHaveBeenCalledTimes(2);
        expect(mockGetUpdatedDatesForPages).toHaveBeenCalledTimes(2);
        expect(mockProcessPages).toHaveBeenCalledTimes(2);
    });

    it('filters out invalid pages', async () => {
        const regionName = 'Test Region';
        const regionPageCount = 3;
        const regionNameIds = { 'Test Region': 'region-id-123' };

        const validPage = createValidPage('728', 'Valid Page', regionName);
        const invalidPage1 = createInvalidPage('9999');
        const invalidPage2 = createInvalidPage('9998');
        const pages = [validPage, invalidPage1, invalidPage2];

        mockGetRopewikiPageInfoForRegion.mockResolvedValue(pages);
        mockGetRopewikiPagesRevisionDates.mockResolvedValue({
            '728': new Date('2024-01-01T00:00:00Z'),
        });
        mockGetUpdatedDatesForPages.mockResolvedValue({
            '728': null,
        });
        mockProcessPages.mockResolvedValue(undefined);

        await handleRopewikiPages(mockConn, regionName, regionPageCount, regionNameIds);

        expect(consoleLogSpy).toHaveBeenCalledWith('Skipping 2 invalid pages...');
        expect(mockGetRopewikiPagesRevisionDates).toHaveBeenCalledWith(['728']);
        expect(mockGetUpdatedDatesForPages).toHaveBeenCalledWith(mockConn, ['728']);
        expect(mockProcessPages).toHaveBeenCalledWith(
            mockConn,
            [validPage],
            { '728': new Date('2024-01-01T00:00:00Z') },
            regionNameIds
        );
    });

    it('skips pages where updatedDate is after revisionDate', async () => {
        const regionName = 'Test Region';
        const regionPageCount = 2;
        const regionNameIds = { 'Test Region': 'region-id-123' };

        const page1 = createValidPage('728', 'Page 1', regionName);
        const page2 = createValidPage('5597', 'Page 2', regionName);
        const pages = [page1, page2];

        mockGetRopewikiPageInfoForRegion.mockResolvedValue(pages);
        mockGetRopewikiPagesRevisionDates.mockResolvedValue({
            '728': new Date('2024-01-01T00:00:00Z'),
            '5597': new Date('2024-01-02T00:00:00Z'),
        });
        mockGetUpdatedDatesForPages.mockResolvedValue({
            '728': new Date('2024-01-02T00:00:00Z'), // Updated after revision
            '5597': new Date('2024-01-03T00:00:00Z'), // Updated after revision
        });
        mockProcessPages.mockResolvedValue(undefined);

        await handleRopewikiPages(mockConn, regionName, regionPageCount, regionNameIds);

        expect(consoleLogSpy).toHaveBeenCalledWith('Skipping parsing/updating for 2 pages...');
        expect(mockProcessPages).not.toHaveBeenCalled();
    });

    it('processes pages where updatedDate is before revisionDate', async () => {
        const regionName = 'Test Region';
        const regionPageCount = 2;
        const regionNameIds = { 'Test Region': 'region-id-123' };

        const page1 = createValidPage('728', 'Page 1', regionName);
        const page2 = createValidPage('5597', 'Page 2', regionName);
        const pages = [page1, page2];

        mockGetRopewikiPageInfoForRegion.mockResolvedValue(pages);
        mockGetRopewikiPagesRevisionDates.mockResolvedValue({
            '728': new Date('2024-01-03T00:00:00Z'),
            '5597': new Date('2024-01-04T00:00:00Z'),
        });
        mockGetUpdatedDatesForPages.mockResolvedValue({
            '728': new Date('2024-01-01T00:00:00Z'), // Updated before revision
            '5597': new Date('2024-01-02T00:00:00Z'), // Updated before revision
        });
        mockProcessPages.mockResolvedValue(undefined);

        await handleRopewikiPages(mockConn, regionName, regionPageCount, regionNameIds);

        expect(mockProcessPages).toHaveBeenCalledTimes(1);
        expect(mockProcessPages).toHaveBeenCalledWith(
            mockConn,
            pages,
            {
                '728': new Date('2024-01-03T00:00:00Z'),
                '5597': new Date('2024-01-04T00:00:00Z'),
            },
            regionNameIds
        );
    });

    it('processes pages where updatedDate is null', async () => {
        const regionName = 'Test Region';
        const regionPageCount = 1;
        const regionNameIds = { 'Test Region': 'region-id-123' };

        const page = createValidPage('728', 'Page 1', regionName);
        const pages = [page];

        mockGetRopewikiPageInfoForRegion.mockResolvedValue(pages);
        mockGetRopewikiPagesRevisionDates.mockResolvedValue({
            '728': new Date('2024-01-01T00:00:00Z'),
        });
        mockGetUpdatedDatesForPages.mockResolvedValue({
            '728': null, // No update date
        });
        mockProcessPages.mockResolvedValue(undefined);

        await handleRopewikiPages(mockConn, regionName, regionPageCount, regionNameIds);

        expect(mockProcessPages).toHaveBeenCalledTimes(1);
        expect(mockProcessPages).toHaveBeenCalledWith(
            mockConn,
            [page],
            { '728': new Date('2024-01-01T00:00:00Z') },
            regionNameIds
        );
    });

    it('skips pages where revisionDate is null', async () => {
        const regionName = 'Test Region';
        const regionPageCount = 2;
        const regionNameIds = { 'Test Region': 'region-id-123' };

        const page1 = createValidPage('728', 'Page 1', regionName);
        const page2 = createValidPage('5597', 'Page 2', regionName);
        const pages = [page1, page2];

        mockGetRopewikiPageInfoForRegion.mockResolvedValue(pages);
        mockGetRopewikiPagesRevisionDates.mockResolvedValue({
            '728': null, // No revision date
            '5597': new Date('2024-01-01T00:00:00Z'),
        });
        mockGetUpdatedDatesForPages.mockResolvedValue({
            '728': null,
            '5597': null,
        });
        mockProcessPages.mockResolvedValue(undefined);

        await handleRopewikiPages(mockConn, regionName, regionPageCount, regionNameIds);

        expect(mockProcessPages).toHaveBeenCalledTimes(1);
        expect(mockProcessPages).toHaveBeenCalledWith(
            mockConn,
            [page2], // Only page2 should be processed
            {
                '728': null,
                '5597': new Date('2024-01-01T00:00:00Z'),
            },
            regionNameIds
        );
    });

    it('propagates errors from getRopewikiPageInfoForRegion()', async () => {
        const regionName = 'Test Region';
        const regionPageCount = 100;
        const regionNameIds = { 'Test Region': 'region-id-123' };

        const error = new Error('API error');
        mockGetRopewikiPageInfoForRegion.mockRejectedValue(error);

        await expect(handleRopewikiPages(mockConn, regionName, regionPageCount, regionNameIds)).rejects.toThrow('API error');
    });

    it('propagates errors from getRopewikiPagesRevisionDates()', async () => {
        const regionName = 'Test Region';
        const regionPageCount = 1;
        const regionNameIds = { 'Test Region': 'region-id-123' };

        const page = createValidPage('728', 'Page 1', regionName);
        mockGetRopewikiPageInfoForRegion.mockResolvedValue([page]);

        const error = new Error('Revision dates error');
        mockGetRopewikiPagesRevisionDates.mockRejectedValue(error);

        await expect(handleRopewikiPages(mockConn, regionName, regionPageCount, regionNameIds)).rejects.toThrow('Revision dates error');
    });

    it('propagates errors from getUpdatedDatesForPages()', async () => {
        const regionName = 'Test Region';
        const regionPageCount = 1;
        const regionNameIds = { 'Test Region': 'region-id-123' };

        const page = createValidPage('728', 'Page 1', regionName);
        mockGetRopewikiPageInfoForRegion.mockResolvedValue([page]);
        mockGetRopewikiPagesRevisionDates.mockResolvedValue({
            '728': new Date('2024-01-01T00:00:00Z'),
        });

        const error = new Error('Database error');
        mockGetUpdatedDatesForPages.mockRejectedValue(error);

        await expect(handleRopewikiPages(mockConn, regionName, regionPageCount, regionNameIds)).rejects.toThrow('Database error');
    });

    it('propagates errors from processPages()', async () => {
        const regionName = 'Test Region';
        const regionPageCount = 1;
        const regionNameIds = { 'Test Region': 'region-id-123' };

        const page = createValidPage('728', 'Page 1', regionName);
        mockGetRopewikiPageInfoForRegion.mockResolvedValue([page]);
        mockGetRopewikiPagesRevisionDates.mockResolvedValue({
            '728': new Date('2024-01-01T00:00:00Z'),
        });
        mockGetUpdatedDatesForPages.mockResolvedValue({
            '728': null,
        });

        const error = new Error('Process pages error');
        mockProcessPages.mockRejectedValue(error);

        await expect(handleRopewikiPages(mockConn, regionName, regionPageCount, regionNameIds)).rejects.toThrow('Process pages error');
    });

    it('does not call processPages when no pages need processing', async () => {
        const regionName = 'Test Region';
        const regionPageCount = 1;
        const regionNameIds = { 'Test Region': 'region-id-123' };

        const page = createValidPage('728', 'Page 1', regionName);
        mockGetRopewikiPageInfoForRegion.mockResolvedValue([page]);
        mockGetRopewikiPagesRevisionDates.mockResolvedValue({
            '728': null, // No revision date, so page will be filtered out
        });
        mockGetUpdatedDatesForPages.mockResolvedValue({
            '728': null,
        });

        await handleRopewikiPages(mockConn, regionName, regionPageCount, regionNameIds);

        expect(mockProcessPages).not.toHaveBeenCalled();
    });

    it('handles mixed scenarios with some pages processed and some skipped', async () => {
        const regionName = 'Test Region';
        const regionPageCount = 3;
        const regionNameIds = { 'Test Region': 'region-id-123' };

        const page1 = createValidPage('728', 'Page 1', regionName);
        const page2 = createValidPage('5597', 'Page 2', regionName);
        const page3 = createValidPage('9999', 'Page 3', regionName);
        const pages = [page1, page2, page3];

        mockGetRopewikiPageInfoForRegion.mockResolvedValue(pages);
        mockGetRopewikiPagesRevisionDates.mockResolvedValue({
            '728': new Date('2024-01-03T00:00:00Z'),
            '5597': new Date('2024-01-02T00:00:00Z'),
            '9999': null, // No revision date
        });
        mockGetUpdatedDatesForPages.mockResolvedValue({
            '728': new Date('2024-01-01T00:00:00Z'), // Updated before revision - should process
            '5597': new Date('2024-01-03T00:00:00Z'), // Updated after revision - should skip
            '9999': null,
        });
        mockProcessPages.mockResolvedValue(undefined);

        await handleRopewikiPages(mockConn, regionName, regionPageCount, regionNameIds);

        expect(consoleLogSpy).toHaveBeenCalledWith('Skipping parsing/updating for 2 pages...');
        expect(mockProcessPages).toHaveBeenCalledTimes(1);
        expect(mockProcessPages).toHaveBeenCalledWith(
            mockConn,
            [page1], // Only page1 should be processed
            {
                '728': new Date('2024-01-03T00:00:00Z'),
                '5597': new Date('2024-01-02T00:00:00Z'),
                '9999': null,
            },
            regionNameIds
        );
    });
});

