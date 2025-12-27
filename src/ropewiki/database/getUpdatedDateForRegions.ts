import * as db from 'zapatos/db';

// Query the RopewikiRegion table for the updatedAt time of the region named "World"
const getUpdatedDateForRegions = async (conn: db.Queryable): Promise<Date | null> => {
    const rows = await db
        .select('RopewikiRegion', { name: 'World' }, { columns: ['updatedAt'] })
        .run(conn);

    if (rows.length === 0 || !rows[0]?.updatedAt) {
        return null;
    }

    const updatedAt = rows[0].updatedAt as string;
    return new Date(updatedAt);
};

export default getUpdatedDateForRegions;