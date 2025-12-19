-- migrate:up

ALTER TABLE "RopewikiRegion"
    DROP CONSTRAINT IF EXISTS "uk_ropewikiRegion_name";

ALTER TABLE "RopewikiRegion"
    ADD CONSTRAINT "uk_ropewikiRegion_name_parentRegion" UNIQUE ("name", "parentRegion");


-- migrate:down

ALTER TABLE "RopewikiRegion"
    DROP CONSTRAINT IF EXISTS "uk_ropewikiRegion_name_parentRegion";

ALTER TABLE "RopewikiRegion"
    ADD CONSTRAINT "uk_ropewikiRegion_name" UNIQUE ("name");
