-- migrate:up

-- Delete all images with null fileUrl or null linkUrl
DELETE FROM "RopewikiImage"
WHERE "fileUrl" IS NULL OR "linkUrl" IS NULL;

-- Alter fileUrl column to be NOT NULL
ALTER TABLE "RopewikiImage"
    ALTER COLUMN "fileUrl" SET NOT NULL;

-- Alter linkUrl column to be NOT NULL
ALTER TABLE "RopewikiImage"
    ALTER COLUMN "linkUrl" SET NOT NULL;

-- migrate:down

-- Alter linkUrl column back to nullable
ALTER TABLE "RopewikiImage"
    ALTER COLUMN "linkUrl" DROP NOT NULL;

-- Alter fileUrl column back to nullable
ALTER TABLE "RopewikiImage"
    ALTER COLUMN "fileUrl" DROP NOT NULL;

