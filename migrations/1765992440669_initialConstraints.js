/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
    pgm.addConstraint('RopewikiRegion', 'fk_ropewikiRegion_parentRegion', {
        foreignKeys: {
            columns: 'parentRegion',
            references: '"RopewikiRegion"(id)',
        },
    });

    pgm.addConstraint('RopewikiRegion', 'uk_ropewikiRegion_name', {
        unique: ['name'],
    });

    pgm.addConstraint('RopewikiPage', 'fk_ropewikiPage_region', {
        foreignKeys: {
            columns: 'region',
            references: '"RopewikiRegion"(id)',
        },
    });

    pgm.addConstraint('RopewikiPage', 'uk_ropewikiPage_pageId', {
        unique: ['pageId'],
    });

    pgm.createIndex('RopewikiPage', 'pageId');

    pgm.addConstraint('RopewikiPageBetaSection', 'fk_ropewikiPageBetaSection_ropewikiPage', {
        foreignKeys: {
            columns: 'ropewikiPage',
            references: '"RopewikiPage"(id)',
        },
    });

    pgm.addConstraint('RopewikiPageBetaSection', 'uk_ropewikiPageBetaSection_ropewikiPage_title', {
        unique: ['ropewikiPage', 'title'],
    });

    pgm.addConstraint('RopewikiImage', 'fk_ropewikiImage_ropewikiPage', {
        foreignKeys: {
            columns: 'ropewikiPage',
            references: '"RopewikiPage"(id)',
        },
    });

    pgm.addConstraint('RopewikiImage', 'fk_ropewikiImage_betaSection', {
        foreignKeys: {
            columns: 'betaSection',
            references: '"RopewikiPageBetaSection"(id)',
        },
    });

    pgm.addConstraint('RopewikiImage', 'uk_ropewikiImage_ropewikiPage_betaSection_fileUrl', {
        unique: ['ropewikiPage', 'betaSection', 'fileUrl'],
    });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {};
