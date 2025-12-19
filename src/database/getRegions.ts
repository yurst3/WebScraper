import * as db from 'zapatos/db';
import type * as s from 'zapatos/schema';

// Fetch all regions from the RopewikiRegion table.
const getRegions = async (conn: db.Queryable): Promise<s.RopewikiRegion.JSONSelectable[]> => {
    return await db
        .select('RopewikiRegion', {})
        .run(conn);
};

export default getRegions;