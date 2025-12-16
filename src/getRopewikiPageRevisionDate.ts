const getRopewikiPageRevisionDate = async (pageId: number): Promise<Date> => {
    const url = `http://ropewiki.com/api.php?action=query&prop=revisions&pageids=${pageId}&format=json`;

    try {
        const response = await fetch(url);

        if (response.ok) {
            const body = await response.json();
            
            // Convert ISO 8601 date/time to Date object
            const isoTimestamp: string = body.query.pages[`${pageId}`].revisions[0].timestamp;
            return new Date(Date.parse(isoTimestamp));
        } else {
            throw new Error(`Error getting page revision date: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        throw new Error(`Error getting page revision date: ${error}`);
    }
}

export default getRopewikiPageRevisionDate;