-- migrate:up

ALTER TABLE "RopewikiRegion"
    ADD COLUMN "latestRevisionDate" timestamp DEFAULT current_timestamp NOT NULL;

ALTER TABLE "RopewikiPage"
    ADD COLUMN "latestRevisionDate" timestamp DEFAULT current_timestamp NOT NULL;

ALTER TABLE "RopewikiPageBetaSection"
    ADD COLUMN "latestRevisionDate" timestamp DEFAULT current_timestamp NOT NULL;

ALTER TABLE "RopewikiImage"
    ADD COLUMN "latestRevisionDate" timestamp DEFAULT current_timestamp NOT NULL;


-- migrate:down

ALTER TABLE "RopewikiImage"
    DROP COLUMN IF EXISTS "latestRevisionDate";

ALTER TABLE "RopewikiPageBetaSection"
    DROP COLUMN IF EXISTS "latestRevisionDate";

ALTER TABLE "RopewikiPage"
    DROP COLUMN IF EXISTS "latestRevisionDate";

ALTER TABLE "RopewikiRegion"
    DROP COLUMN IF EXISTS "latestRevisionDate";
