import { Queryable } from "zapatos/db";
import getRopewikiPageInfoForRegion from "./http/getRopewikiPageInfoForRegion";
import RopewikiPageInfo from "./types/ropewiki";
import getRopewikiPagesRevisionDates from "./http/getRopewikiPageRevisionDate";
import getUpdatedDatesForPages from "./database/getUpdatedDatesForPages";
import cliProgress from 'cli-progress';
import getRopewikiPageHtml from "./http/getRopewikiPageHtml";
import parseRopewikiPage from "./parsers/parseRopewikiPage";
import upsertPage from "./database/upsertPage";
import upsertBetaSections from "./database/upsertBetaSections";
import upsertImages from "./database/upsertImages";
import setBetaSectionsDeletedAt from "./database/setBetaSectionsDeletedAt";
import setImagesDeletedAt from "./database/setImagesDeletedAt";

const CHUNK_SIZE = 100; // DO NOT EXCEED 2000
const REGION = 'World';

const processPages = async (
    conn: Queryable,
    pages: RopewikiPageInfo[],
    pageRevisionDates: {[pageId: string]: Date | null},
    regionNameIds: {[name: string]: string},
    offset: number,
) => {
    const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    progressBar.start(offset + pages.length, offset);

    for (const page of pages) {
        const latestRevisionDate: Date | null | undefined = pageRevisionDates[page.pageid];
        if (!latestRevisionDate) { // This should never be null/undefined since we already filtered pages
            progressBar.increment();
            continue; 
        }
        const regionId: string | undefined = regionNameIds[page.region];
        if (!regionId) {
            console.error(`${page.pageid} ${page.name} doesn't have a valid region: ${page.region}`);
            progressBar.increment();
            continue;
        }

        const pageHTML: string = await getRopewikiPageHtml(page.pageid);
        const pageUuid: string = await upsertPage(conn, page, regionId, latestRevisionDate);

        const { beta, images } = await parseRopewikiPage(pageHTML);

        // Upsert beta sections and image, overriding the deletedAt date if any were set
        const betaTitleIds = await upsertBetaSections(conn, pageUuid, beta, latestRevisionDate);
        const updatedBetaSectionIds = Object.values(betaTitleIds);
        const updatedImageIds = await upsertImages(conn, pageUuid, images, betaTitleIds, latestRevisionDate);

        // Assume that beta sections & images which have not been upserted are deleted
        await setBetaSectionsDeletedAt(conn, pageUuid, updatedBetaSectionIds);
        await setImagesDeletedAt(conn, pageUuid, updatedImageIds);

        progressBar.increment();
    }

    progressBar.stop();
}

const handleRopewikiPages = async (conn: Queryable, regionNameIds: {[name: string]: string}) => {
    let pagesReturned: number = CHUNK_SIZE;
    let offset: number = 0;

    while (pagesReturned === CHUNK_SIZE) {
        // Has a limit of 2000 pages per request
        const pages: RopewikiPageInfo[] = await getRopewikiPageInfoForRegion(REGION, offset, CHUNK_SIZE);

        // We only want to store valid pages (must have a pageid, name, region, and url)
        const validPages: RopewikiPageInfo[] = pages.filter(page => page.isValid);
        const validPageIds: string[] = validPages.map(page => page.pageid);

        if (pages.length - validPages.length > 0) console.log(`Skipping ${pages.length - validPages.length} invalid pages...`)

        // Has a limit of 50 pageIds per request (will chunk into requests with 50 ids if larger)
        const pageRevisionDates: {[pageId: string]: Date | null} = await getRopewikiPagesRevisionDates(validPageIds);
        const pageUpdateDates: {[pageId: string]: Date | null} = await getUpdatedDatesForPages(conn, validPageIds);

        const validPagesToParse: RopewikiPageInfo[] = validPages.filter(page => {
            const revisionDate = pageRevisionDates[page.pageid];
            const updatedDate = pageUpdateDates[page.pageid];

            if (!revisionDate) return false; // Ignore pages where we couldn't find a latest revision date
            if (!updatedDate) return true; // Always parse and save when we don't have an updated date
            return updatedDate < revisionDate; // Otherwise only parse if there has been a revision since the last update
        });

        if (validPages.length - validPagesToParse.length > 0) console.log(`Skipping parsing and updating ${validPages.length - validPagesToParse.length} pages...`); 

        if (validPagesToParse.length) {
            await processPages(conn, validPagesToParse, pageRevisionDates, regionNameIds, offset);
        }

        pagesReturned = pages.length;
    }
}

export default handleRopewikiPages;