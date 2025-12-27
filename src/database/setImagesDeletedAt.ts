import * as db from 'zapatos/db';

// Set deletedAt to now for all images with the given pageUuid
// that are NOT in the updatedImageIds array and have deletedAt = null.
const setImagesDeletedAt = async (
    tx: db.Queryable,
    pageUuid: string,
    updatedImageIds: string[],
): Promise<void> => {
    const now = new Date();

    await db
        .update(
            'RopewikiImage',
            { deletedAt: now },
            {
                ropewikiPage: pageUuid,
                id: db.conditions.isNotIn(updatedImageIds),
                deletedAt: db.conditions.isNull,
            }
        )
        .run(tx);
};

export default setImagesDeletedAt;

