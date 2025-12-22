import cliProgress from 'cli-progress';
import { Queryable } from "zapatos/db";
import RopewikiPageInfo from "./types/ropewiki";
import getRopewikiPageHtml from "./http/getRopewikiPageHtml";
import parseRopewikiPage from "./parsers/parseRopewikiPage";
import upsertPage from "./database/upsertPage";
import upsertBetaSections from "./database/upsertBetaSections";
import upsertImages from "./database/upsertImages";
import setBetaSectionsDeletedAt from "./database/setBetaSectionsDeletedAt";
import setImagesDeletedAt from "./database/setImagesDeletedAt";

const processPages = async (
    conn: Queryable,
    pages: RopewikiPageInfo[],
    pageRevisionDates: {[pageId: string]: Date | null},
    regionNameIds: {[name: string]: string},
) => {
    const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    progressBar.start(pages.length, 0);

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

export default processPages;