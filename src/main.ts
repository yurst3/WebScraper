/* eslint-disable @typescript-eslint/no-unused-vars */
import getRopewikiPageHtml from './getRopewikiPageHtml';
import parseRopewikiPage from './parseRopewikiPage';
import getRopewikiPageInfoForRegion from './getRopewikiPageInfoForRegion';

(async () => {
    const pageInfos = await getRopewikiPageInfoForRegion('World', 0, 10);
})()