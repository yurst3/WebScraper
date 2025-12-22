import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import processPages from '../processPages';
import getRopewikiPageHtml from '../http/getRopewikiPageHtml';
import parseRopewikiPage from '../parsers/parseRopewikiPage';
import upsertPage from '../database/upsertPage';
import upsertBetaSections from '../database/upsertBetaSections';
import upsertImages from '../database/upsertImages';
import setBetaSectionsDeletedAt from '../database/setBetaSectionsDeletedAt';
import setImagesDeletedAt from '../database/setImagesDeletedAt';
import RopewikiPageInfo from '../types/ropewiki';
import * as db from 'zapatos/db';

// Mock the dependencies
jest.mock('../http/getRopewikiPageHtml');
jest.mock('../parsers/parseRopewikiPage');
jest.mock('../database/upsertPage');
jest.mock('../database/upsertBetaSections');
jest.mock('../database/upsertImages');
jest.mock('../database/setBetaSectionsDeletedAt');
jest.mock('../database/setImagesDeletedAt');
jest.mock('cli-progress', () => {
    const mockProgressBarInstance = {
        start: jest.fn(),
        increment: jest.fn(),
        stop: jest.fn(),
    };
    return {
        __esModule: true,
        default: {
            SingleBar: jest.fn(() => mockProgressBarInstance),
            Presets: {
                shades_classic: {},
            },
        },
    };
});

const mockGetRopewikiPageHtml = getRopewikiPageHtml as jest.MockedFunction<typeof getRopewikiPageHtml>;
const mockParseRopewikiPage = parseRopewikiPage as jest.MockedFunction<typeof parseRopewikiPage>;
const mockUpsertPage = upsertPage as jest.MockedFunction<typeof upsertPage>;
const mockUpsertBetaSections = upsertBetaSections as jest.MockedFunction<typeof upsertBetaSections>;
const mockUpsertImages = upsertImages as jest.MockedFunction<typeof upsertImages>;
const mockSetBetaSectionsDeletedAt = setBetaSectionsDeletedAt as jest.MockedFunction<typeof setBetaSectionsDeletedAt>;
const mockSetImagesDeletedAt = setImagesDeletedAt as jest.MockedFunction<typeof setImagesDeletedAt>;

describe('processPages', () => {
    const mockConn = {} as db.Queryable;

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset the progress bar mocks by accessing through the mocked module
        const cliProgress = require('cli-progress');
        const mockProgressBar = cliProgress.default.SingleBar.mock.results[0]?.value;
        if (mockProgressBar) {
            mockProgressBar.start.mockClear();
            mockProgressBar.increment.mockClear();
            mockProgressBar.stop.mockClear();
        }
    });

    it('processes pages successfully', async () => {
        const page1 = new RopewikiPageInfo({
            printouts: {
                pageid: ['728'],
                name: ['Bear Creek Canyon'],
                region: [{ fulltext: 'Test Region' }],
                url: ['https://ropewiki.com/Bear_Creek_Canyon'],
            },
        });
        const page2 = new RopewikiPageInfo({
            printouts: {
                pageid: ['5597'],
                name: ['Regions'],
                region: [{ fulltext: 'Test Region' }],
                url: ['https://ropewiki.com/Regions'],
            },
        });

        const pages = [page1, page2];
        const pageRevisionDates = {
            '728': new Date('2024-01-01T00:00:00Z'),
            '5597': new Date('2024-01-02T00:00:00Z'),
        };
        const regionNameIds = {
            'Test Region': 'region-id-123',
        };

        mockGetRopewikiPageHtml
            .mockResolvedValueOnce('<html>Page 1</html>')
            .mockResolvedValueOnce('<html>Page 2</html>');
        mockParseRopewikiPage
            .mockResolvedValueOnce({
                beta: [{ title: 'Introduction', text: 'Text 1' }],
                images: [{ fileUrl: 'image1.jpg', linkUrl: 'link1', betaSectionTitle: undefined, caption: undefined }],
            })
            .mockResolvedValueOnce({
                beta: [{ title: 'Approach', text: 'Text 2' }],
                images: [],
            });
        mockUpsertPage
            .mockResolvedValueOnce('page-uuid-1')
            .mockResolvedValueOnce('page-uuid-2');
        mockUpsertBetaSections
            .mockResolvedValueOnce({ 'Introduction': 'beta-id-1' })
            .mockResolvedValueOnce({ 'Approach': 'beta-id-2' });
        mockUpsertImages
            .mockResolvedValueOnce(['image-id-1'])
            .mockResolvedValueOnce([]);

        await processPages(mockConn, pages, pageRevisionDates, regionNameIds);

        const cliProgress = require('cli-progress');
        const mockProgressBar = cliProgress.default.SingleBar.mock.results[0]?.value;
        expect(mockProgressBar.start).toHaveBeenCalledWith(2, 0);
        expect(mockProgressBar.increment).toHaveBeenCalledTimes(2);
        expect(mockProgressBar.stop).toHaveBeenCalledTimes(1);

        expect(mockGetRopewikiPageHtml).toHaveBeenCalledTimes(2);
        expect(mockGetRopewikiPageHtml).toHaveBeenNthCalledWith(1, '728');
        expect(mockGetRopewikiPageHtml).toHaveBeenNthCalledWith(2, '5597');

        expect(mockUpsertPage).toHaveBeenCalledTimes(2);
        expect(mockUpsertPage).toHaveBeenNthCalledWith(1, mockConn, page1, 'region-id-123', pageRevisionDates['728']);
        expect(mockUpsertPage).toHaveBeenNthCalledWith(2, mockConn, page2, 'region-id-123', pageRevisionDates['5597']);

        expect(mockUpsertBetaSections).toHaveBeenCalledTimes(2);
        expect(mockUpsertImages).toHaveBeenCalledTimes(2);
        expect(mockSetBetaSectionsDeletedAt).toHaveBeenCalledTimes(2);
        expect(mockSetImagesDeletedAt).toHaveBeenCalledTimes(2);
    });

    it('skips pages with null or undefined latestRevisionDate', async () => {
        const page = new RopewikiPageInfo({
            printouts: {
                pageid: ['728'],
                name: ['Bear Creek Canyon'],
                region: [{ fulltext: 'Test Region' }],
                url: ['https://ropewiki.com/Bear_Creek_Canyon'],
            },
        });

        const pages = [page];
        const pageRevisionDates: { [pageId: string]: Date | null } = {
            '728': null,
        };
        const regionNameIds = {
            'Test Region': 'region-id-123',
        };

        await processPages(mockConn, pages, pageRevisionDates, regionNameIds);

        const cliProgress = require('cli-progress');
        const mockProgressBar = cliProgress.default.SingleBar.mock.results[0]?.value;
        expect(mockProgressBar.start).toHaveBeenCalledWith(1, 0);
        expect(mockProgressBar.increment).toHaveBeenCalledTimes(1);
        expect(mockProgressBar.stop).toHaveBeenCalledTimes(1);

        expect(mockGetRopewikiPageHtml).not.toHaveBeenCalled();
        expect(mockUpsertPage).not.toHaveBeenCalled();
    });

    it('skips pages with invalid region (no regionId)', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        const page = new RopewikiPageInfo({
            printouts: {
                pageid: ['728'],
                name: ['Bear Creek Canyon'],
                region: [{ fulltext: 'Invalid Region' }],
                url: ['https://ropewiki.com/Bear_Creek_Canyon'],
            },
        });

        const pages = [page];
        const pageRevisionDates = {
            '728': new Date('2024-01-01T00:00:00Z'),
        };
        const regionNameIds = {
            'Test Region': 'region-id-123',
        };

        await processPages(mockConn, pages, pageRevisionDates, regionNameIds);

        expect(consoleErrorSpy).toHaveBeenCalledWith('728 Bear Creek Canyon doesn\'t have a valid region: Invalid Region');
        const cliProgress = require('cli-progress');
        const mockProgressBar = cliProgress.default.SingleBar.mock.results[0]?.value;
        expect(mockProgressBar.increment).toHaveBeenCalledTimes(1);
        expect(mockGetRopewikiPageHtml).not.toHaveBeenCalled();
        expect(mockUpsertPage).not.toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
    });

    it('sets deletedAt for beta sections and images not in updated lists', async () => {
        const page = new RopewikiPageInfo({
            printouts: {
                pageid: ['728'],
                name: ['Bear Creek Canyon'],
                region: [{ fulltext: 'Test Region' }],
                url: ['https://ropewiki.com/Bear_Creek_Canyon'],
            },
        });

        const pages = [page];
        const pageRevisionDates = {
            '728': new Date('2024-01-01T00:00:00Z'),
        };
        const regionNameIds = {
            'Test Region': 'region-id-123',
        };

        mockGetRopewikiPageHtml.mockResolvedValue('<html>Page</html>');
        mockParseRopewikiPage.mockResolvedValue({
            beta: [{ title: 'Introduction', text: 'Text' }],
            images: [{ fileUrl: 'image1.jpg', linkUrl: undefined, betaSectionTitle: undefined, caption: undefined }],
        });
        mockUpsertPage.mockResolvedValue('page-uuid-1');
        mockUpsertBetaSections.mockResolvedValue({ 'Introduction': 'beta-id-1' });
        mockUpsertImages.mockResolvedValue(['image-id-1']);

        await processPages(mockConn, pages, pageRevisionDates, regionNameIds);

        expect(mockSetBetaSectionsDeletedAt).toHaveBeenCalledWith(mockConn, 'page-uuid-1', ['beta-id-1']);
        expect(mockSetImagesDeletedAt).toHaveBeenCalledWith(mockConn, 'page-uuid-1', ['image-id-1']);
    });

    it('propagates errors from getRopewikiPageHtml()', async () => {
        const page = new RopewikiPageInfo({
            printouts: {
                pageid: ['728'],
                name: ['Bear Creek Canyon'],
                region: [{ fulltext: 'Test Region' }],
                url: ['https://ropewiki.com/Bear_Creek_Canyon'],
            },
        });

        const pages = [page];
        const pageRevisionDates = {
            '728': new Date('2024-01-01T00:00:00Z'),
        };
        const regionNameIds = {
            'Test Region': 'region-id-123',
        };

        const htmlError = new Error('Failed to fetch HTML');
        mockGetRopewikiPageHtml.mockRejectedValue(htmlError);

        await expect(processPages(mockConn, pages, pageRevisionDates, regionNameIds)).rejects.toThrow('Failed to fetch HTML');
    });

    it('propagates errors from upsertPage()', async () => {
        const page = new RopewikiPageInfo({
            printouts: {
                pageid: ['728'],
                name: ['Bear Creek Canyon'],
                region: [{ fulltext: 'Test Region' }],
                url: ['https://ropewiki.com/Bear_Creek_Canyon'],
            },
        });

        const pages = [page];
        const pageRevisionDates = {
            '728': new Date('2024-01-01T00:00:00Z'),
        };
        const regionNameIds = {
            'Test Region': 'region-id-123',
        };

        mockGetRopewikiPageHtml.mockResolvedValue('<html>Page</html>');
        const dbError = new Error('Database error');
        mockUpsertPage.mockRejectedValue(dbError);

        await expect(processPages(mockConn, pages, pageRevisionDates, regionNameIds)).rejects.toThrow('Database error');
    });

    it('propagates errors from parseRopewikiPage()', async () => {
        const page = new RopewikiPageInfo({
            printouts: {
                pageid: ['728'],
                name: ['Bear Creek Canyon'],
                region: [{ fulltext: 'Test Region' }],
                url: ['https://ropewiki.com/Bear_Creek_Canyon'],
            },
        });

        const pages = [page];
        const pageRevisionDates = {
            '728': new Date('2024-01-01T00:00:00Z'),
        };
        const regionNameIds = {
            'Test Region': 'region-id-123',
        };

        mockGetRopewikiPageHtml.mockResolvedValue('<html>Page</html>');
        mockUpsertPage.mockResolvedValue('page-uuid-1');
        const parseError = new Error('Parse error');
        mockParseRopewikiPage.mockRejectedValue(parseError);

        await expect(processPages(mockConn, pages, pageRevisionDates, regionNameIds)).rejects.toThrow('Parse error');
    });

    it('propagates errors from upsertBetaSections()', async () => {
        const page = new RopewikiPageInfo({
            printouts: {
                pageid: ['728'],
                name: ['Bear Creek Canyon'],
                region: [{ fulltext: 'Test Region' }],
                url: ['https://ropewiki.com/Bear_Creek_Canyon'],
            },
        });

        const pages = [page];
        const pageRevisionDates = {
            '728': new Date('2024-01-01T00:00:00Z'),
        };
        const regionNameIds = {
            'Test Region': 'region-id-123',
        };

        mockGetRopewikiPageHtml.mockResolvedValue('<html>Page</html>');
        mockUpsertPage.mockResolvedValue('page-uuid-1');
        mockParseRopewikiPage.mockResolvedValue({
            beta: [{ title: 'Introduction', text: 'Text' }],
            images: [],
        });
        const betaError = new Error('Beta sections error');
        mockUpsertBetaSections.mockRejectedValue(betaError);

        await expect(processPages(mockConn, pages, pageRevisionDates, regionNameIds)).rejects.toThrow('Beta sections error');
    });

    it('propagates errors from upsertImages()', async () => {
        const page = new RopewikiPageInfo({
            printouts: {
                pageid: ['728'],
                name: ['Bear Creek Canyon'],
                region: [{ fulltext: 'Test Region' }],
                url: ['https://ropewiki.com/Bear_Creek_Canyon'],
            },
        });

        const pages = [page];
        const pageRevisionDates = {
            '728': new Date('2024-01-01T00:00:00Z'),
        };
        const regionNameIds = {
            'Test Region': 'region-id-123',
        };

        mockGetRopewikiPageHtml.mockResolvedValue('<html>Page</html>');
        mockUpsertPage.mockResolvedValue('page-uuid-1');
        mockParseRopewikiPage.mockResolvedValue({
            beta: [{ title: 'Introduction', text: 'Text' }],
            images: [{ fileUrl: 'image1.jpg', linkUrl: undefined, betaSectionTitle: undefined, caption: undefined }],
        });
        mockUpsertBetaSections.mockResolvedValue({ 'Introduction': 'beta-id-1' });
        const imagesError = new Error('Images error');
        mockUpsertImages.mockRejectedValue(imagesError);

        await expect(processPages(mockConn, pages, pageRevisionDates, regionNameIds)).rejects.toThrow('Images error');
    });

    it('propagates errors from setBetaSectionsDeletedAt()', async () => {
        const page = new RopewikiPageInfo({
            printouts: {
                pageid: ['728'],
                name: ['Bear Creek Canyon'],
                region: [{ fulltext: 'Test Region' }],
                url: ['https://ropewiki.com/Bear_Creek_Canyon'],
            },
        });

        const pages = [page];
        const pageRevisionDates = {
            '728': new Date('2024-01-01T00:00:00Z'),
        };
        const regionNameIds = {
            'Test Region': 'region-id-123',
        };

        mockGetRopewikiPageHtml.mockResolvedValue('<html>Page</html>');
        mockUpsertPage.mockResolvedValue('page-uuid-1');
        mockParseRopewikiPage.mockResolvedValue({
            beta: [{ title: 'Introduction', text: 'Text' }],
            images: [],
        });
        mockUpsertBetaSections.mockResolvedValue({ 'Introduction': 'beta-id-1' });
        mockUpsertImages.mockResolvedValue([]);
        const deleteError = new Error('Delete beta sections error');
        mockSetBetaSectionsDeletedAt.mockRejectedValue(deleteError);

        await expect(processPages(mockConn, pages, pageRevisionDates, regionNameIds)).rejects.toThrow('Delete beta sections error');
    });

    it('propagates errors from setImagesDeletedAt()', async () => {
        const page = new RopewikiPageInfo({
            printouts: {
                pageid: ['728'],
                name: ['Bear Creek Canyon'],
                region: [{ fulltext: 'Test Region' }],
                url: ['https://ropewiki.com/Bear_Creek_Canyon'],
            },
        });

        const pages = [page];
        const pageRevisionDates = {
            '728': new Date('2024-01-01T00:00:00Z'),
        };
        const regionNameIds = {
            'Test Region': 'region-id-123',
        };

        mockGetRopewikiPageHtml.mockResolvedValue('<html>Page</html>');
        mockUpsertPage.mockResolvedValue('page-uuid-1');
        mockParseRopewikiPage.mockResolvedValue({
            beta: [{ title: 'Introduction', text: 'Text' }],
            images: [{ fileUrl: 'image1.jpg', linkUrl: undefined, betaSectionTitle: undefined, caption: undefined }],
        });
        mockUpsertBetaSections.mockResolvedValue({ 'Introduction': 'beta-id-1' });
        mockUpsertImages.mockResolvedValue(['image-id-1']);
        mockSetBetaSectionsDeletedAt.mockResolvedValue();
        const deleteError = new Error('Delete images error');
        mockSetImagesDeletedAt.mockRejectedValue(deleteError);

        await expect(processPages(mockConn, pages, pageRevisionDates, regionNameIds)).rejects.toThrow('Delete images error');
    });
});

