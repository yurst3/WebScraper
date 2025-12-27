import * as db from 'zapatos/db';

// Get all child regions (regions whose parentRegion matches the given regionName).
// Returns an array of region names.
const getChildRegions = async (
    conn: db.Queryable,
    regionName: string,
): Promise<string[]> => {
    // First, find the region with the given name to get its ID
    const parentRegion = await db
        .select('RopewikiRegion', { name: regionName })
        .run(conn);

    if (parentRegion.length === 0) {
        throw new Error(`Region not found: ${regionName}`);
    }

    const parentRegionId = parentRegion[0]?.id as string;

    // Find all regions where parentRegion matches the parent's ID
    const childRegions = await db
        .select('RopewikiRegion', { parentRegion: parentRegionId })
        .run(conn);

    // Return an array of region names
    return childRegions.map(region => region.name as string);
};

export default getChildRegions;

