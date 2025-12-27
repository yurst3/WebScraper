import * as db from 'zapatos/db';

const getUpdatedDatesForPages = async (
    conn: db.Queryable,
    pageIds: string[],
): Promise<{ [pageId: string]: Date | null }> => {
    if (pageIds.length === 0) return {};

    const rows: db.JSONOnlyColsForTable<"RopewikiPage", ("updatedAt" | "pageId")[]>[] = await db.select(
        'RopewikiPage',
        { pageId: db.conditions.isIn(pageIds) },
        { columns: ['pageId', 'updatedAt'] }
    ).run(conn);

    const foundPages: { [pageId: string]: Date | null } = Object.fromEntries(rows.map(row => [
        row.pageId as string,
        new Date(row.updatedAt)
    ]));

    pageIds.forEach(pageId => {
        if (!foundPages[pageId]) foundPages[pageId] = null;
    });

    return foundPages;
};

export default getUpdatedDatesForPages;

