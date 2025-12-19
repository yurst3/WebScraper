import * as db from 'zapatos/db';
import { RopewikiRegion } from '../types/ropewiki';

// Insert or update a batch of regions.
// On conflict (same name & parentRegion), update the region fields and timestamps, including latestRevisionDate.
const upsertRegions = async (
    conn: db.Queryable,
    regions: RopewikiRegion[],
    latestRevisionDate: Date,
): Promise<void> => {
    if (regions.length === 0) return;

    const now = new Date();

    const rows = regions.map((region) => ({
        id: region.id,
        name: region.name,
        parentRegion: region.parentRegion ?? null,
        latestRevisionDate,
        updatedAt: now,
    }));

    await db
        .upsert('RopewikiRegion', rows, ['id'], {
            updateColumns: ['name', 'parentRegion', 'latestRevisionDate', 'updatedAt'],
        })
        .run(conn);
};

export default upsertRegions;


