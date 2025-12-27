import chunk from 'lodash/chunk';

const API_PAGEID_LIMIT = 50;

const getRopewikiPagesRevisionDates = async (pageIds: string[]): Promise<{[pageId: string]: Date | null}> => {
    const pageIdChunks = chunk(pageIds, API_PAGEID_LIMIT);
    const revisionDates: {[pageId: string]: Date | null} = {};
    
    for (const chunkIds of pageIdChunks) {
        const pageIdsParam = chunkIds.join('|');
        const url = `http://ropewiki.com/api.php?action=query&prop=revisions&pageids=${pageIdsParam}&format=json`;

        try {
            const response = await fetch(url);

            if (response.ok) {
                const body = await response.json();
                chunkIds.forEach(pageId => {
                    const revisionDateTimestamp: string | undefined = body.query.pages[pageId]?.revisions[0]?.timestamp;
                    if (!revisionDateTimestamp) revisionDates[pageId] = null;
                    else revisionDates[pageId] = new Date(revisionDateTimestamp);
                });
            } else {
                throw new Error(`Error getting page revision date: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            throw new Error(`Error getting page revision date: ${error}`);
        }
    }

    return revisionDates;
}

export default getRopewikiPagesRevisionDates;