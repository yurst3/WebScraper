import * as db from 'zapatos/db';

// Set deletedAt to now for all beta sections with the given pageUuid
// that are NOT in the updatedBetaSectionIds array.
const setBetaSectionsDeletedAt = async (
    tx: db.Queryable,
    pageUuid: string,
    updatedBetaSectionIds: string[],
): Promise<void> => {
    const now = new Date();

    await db
        .update(
            'RopewikiPageBetaSection',
            { deletedAt: now },
            {
                ropewikiPage: pageUuid,
                id: db.conditions.isNotIn(updatedBetaSectionIds),
                deletedAt: db.conditions.isNull,
            }
        )
        .run(tx);
};

export default setBetaSectionsDeletedAt;

