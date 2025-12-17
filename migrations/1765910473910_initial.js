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
    pgm.createTable('RopewikiRegion', {
        id: { type: 'uuid', primaryKey: true },
        parentRegion: { type: 'uuid', notNull: false },
        name: { type: 'text', notNull: true },
        createdAt: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
        updatedAt: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
        deletedAt: {
            type: 'timestamp',
            notNull: false,
        },
    });

    pgm.createTable('RopewikiPage', {
        id: { type: 'uuid', primaryKey: true },
        pageId: { type: 'text', notNull: true },
        name: { type: 'text', notNull: true },
        region: { type: 'uuid', notNull: true },
        url: { type: 'text', notNull: true },
        rating: { type: 'text', notNull: false },
        timeRating: { type: 'text', notNull: false },
        kmlUrl: { type: 'text', notNull: false },
        technicalRating: { type: 'text', notNull: false },
        waterRating: { type: 'text', notNull: false },
        riskRating: { type: 'text', notNull: false },
        permits: { type: 'text', notNull: false },
        rappelCount: { type: 'text', notNull: false },
        vehicle: { type: 'text', notNull: false },
        quality: { type: 'numeric', notNull: false },
        coordinates: { type: 'jsonb', notNull: false },
        rappelLongest: { type: 'jsonb', notNull: false },
        shuttle: { type: 'jsonb', notNull: false },
        minTime: { type: 'jsonb', notNull: false },
        maxTime: { type: 'jsonb', notNull: false },
        hike: { type: 'jsonb', notNull: false },
        months: { type: 'jsonb', notNull: false },
        createdAt: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
        updatedAt: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
        deletedAt: {
            type: 'timestamp',
            notNull: false,
        },
    });

    pgm.createTable('RopewikiPageBetaSection', {
        id: { type: 'uuid', primaryKey: true },
        ropewikiPage: { type: 'uuid', notNull: true },
        title: { type: 'text', notNull: true },
        text: { type: 'text', notNull: true },
        createdAt: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
        updatedAt: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
        deletedAt: {
            type: 'timestamp',
            notNull: false,
        },
    });

    pgm.createTable('RopewikiImage', {
        id: { type: 'uuid', primaryKey: true },
        ropewikiPage: { type: 'uuid', notNull: true },
        betaSection: { type: 'uuid', notNull: false },
        linkUrl: { type: 'text', notNull: false },
        fileUrl: { type: 'text', notNull: false },
        caption: { type: 'text', notNull: false },
        createdAt: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
        updatedAt: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
        deletedAt: {
            type: 'timestamp',
            notNull: false,
        },
    });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
    pgm.dropTable('RopewikiImage');
    pgm.dropTable('RopewikiPageBetaSection');
    pgm.dropTable('RopewikiPage');
    pgm.dropTable('RopewikiRegion');
};
