-- migrate:up

-- Drop the existing unique constraint
ALTER TABLE "RopewikiImage"
    DROP CONSTRAINT IF EXISTS "uk_ropewikiImage_ropewikiPage_betaSection_fileUrl";

-- Recreate the unique constraint with NULLS NOT DISTINCT on betaSection
ALTER TABLE "RopewikiImage"
    ADD CONSTRAINT "uk_ropewikiImage_ropewikiPage_betaSection_fileUrl"
    UNIQUE NULLS NOT DISTINCT ("ropewikiPage", "betaSection", "fileUrl");

-- migrate:down

-- Drop the constraint with NULLS NOT DISTINCT
ALTER TABLE "RopewikiImage"
    DROP CONSTRAINT IF EXISTS "uk_ropewikiImage_ropewikiPage_betaSection_fileUrl";

-- Recreate the original constraint without NULLS NOT DISTINCT
ALTER TABLE "RopewikiImage"
    ADD CONSTRAINT "uk_ropewikiImage_ropewikiPage_betaSection_fileUrl"
    UNIQUE ("ropewikiPage", "betaSection", "fileUrl");

