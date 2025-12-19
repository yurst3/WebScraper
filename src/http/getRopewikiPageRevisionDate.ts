const getRopewikiPagesRevisionDates = async (pageIds: string[]): Promise<{[pageId: string]: Date | null}> => {
    const pageIdsParam = pageIds.join('|');
    const url = `http://ropewiki.com/api.php?action=query&prop=revisions&pageids=${pageIdsParam}&format=json`;

    try {
        const response = await fetch(url);

        if (response.ok) {
            const body = await response.json();
            return Object.fromEntries(pageIds.map(pageId => {
                const revisionDateTimestamp: string | undefined = body.query.pages[pageId]?.revisions[0]?.timestamp;
                if (!revisionDateTimestamp) return [pageId, null];
                else return [pageId, new Date(Date.parse(revisionDateTimestamp))];
            }))
        } else {
            throw new Error(`Error getting page revision date: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        throw new Error(`Error getting page revision date: ${error}`);
    }
}

export default getRopewikiPagesRevisionDates;