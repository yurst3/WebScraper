-- migrate:up

-- Add default UUID v4 generation for id columns
ALTER TABLE "RopewikiPage"
    ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "RopewikiPageBetaSection"
    ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "RopewikiImage"
    ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- migrate:down

-- Remove default UUID generation from id columns
ALTER TABLE "RopewikiImage"
    ALTER COLUMN "id" DROP DEFAULT;

ALTER TABLE "RopewikiPageBetaSection"
    ALTER COLUMN "id" DROP DEFAULT;

ALTER TABLE "RopewikiPage"
    ALTER COLUMN "id" DROP DEFAULT;

