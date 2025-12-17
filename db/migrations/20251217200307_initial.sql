-- migrate:up

CREATE TABLE "RopewikiRegion" (
    "id" uuid PRIMARY KEY,
    "parentRegion" uuid,
    "name" text NOT NULL,
    "createdAt" timestamp DEFAULT current_timestamp NOT NULL,
    "updatedAt" timestamp DEFAULT current_timestamp NOT NULL,
    "deletedAt" timestamp
);

CREATE TABLE "RopewikiPage" (
    "id" uuid PRIMARY KEY,
    "pageId" text NOT NULL,
    "name" text NOT NULL,
    "region" uuid NOT NULL,
    "url" text NOT NULL,
    "rating" text,
    "timeRating" text,
    "kmlUrl" text,
    "technicalRating" text,
    "waterRating" text,
    "riskRating" text,
    "permits" text,
    "rappelCount" text,
    "vehicle" text,
    "quality" numeric,
    "coordinates" jsonb,
    "rappelLongest" jsonb,
    "shuttle" jsonb,
    "minTime" jsonb,
    "maxTime" jsonb,
    "hike" jsonb,
    "months" jsonb,
    "createdAt" timestamp DEFAULT current_timestamp NOT NULL,
    "updatedAt" timestamp DEFAULT current_timestamp NOT NULL,
    "deletedAt" timestamp
);

CREATE TABLE "RopewikiPageBetaSection" (
    "id" uuid PRIMARY KEY,
    "ropewikiPage" uuid NOT NULL,
    "title" text NOT NULL,
    "text" text NOT NULL,
    "createdAt" timestamp DEFAULT current_timestamp NOT NULL,
    "updatedAt" timestamp DEFAULT current_timestamp NOT NULL,
    "deletedAt" timestamp
);

CREATE TABLE "RopewikiImage" (
    "id" uuid PRIMARY KEY,
    "ropewikiPage" uuid NOT NULL,
    "betaSection" uuid,
    "linkUrl" text,
    "fileUrl" text,
    "caption" text,
    "createdAt" timestamp DEFAULT current_timestamp NOT NULL,
    "updatedAt" timestamp DEFAULT current_timestamp NOT NULL,
    "deletedAt" timestamp
);

-- Foreign key constraints
ALTER TABLE "RopewikiRegion"
    ADD CONSTRAINT "fk_ropewikiRegion_parentRegion" 
    FOREIGN KEY ("parentRegion") REFERENCES "RopewikiRegion"("id");

ALTER TABLE "RopewikiPage"
    ADD CONSTRAINT "fk_ropewikiPage_region" 
    FOREIGN KEY ("region") REFERENCES "RopewikiRegion"("id");

ALTER TABLE "RopewikiPageBetaSection"
    ADD CONSTRAINT "fk_ropewikiPageBetaSection_ropewikiPage" 
    FOREIGN KEY ("ropewikiPage") REFERENCES "RopewikiPage"("id");

ALTER TABLE "RopewikiImage"
    ADD CONSTRAINT "fk_ropewikiImage_ropewikiPage" 
    FOREIGN KEY ("ropewikiPage") REFERENCES "RopewikiPage"("id");

ALTER TABLE "RopewikiImage"
    ADD CONSTRAINT "fk_ropewikiImage_betaSection" 
    FOREIGN KEY ("betaSection") REFERENCES "RopewikiPageBetaSection"("id");

-- Unique constraints
ALTER TABLE "RopewikiRegion"
    ADD CONSTRAINT "uk_ropewikiRegion_name" UNIQUE ("name");

ALTER TABLE "RopewikiPage"
    ADD CONSTRAINT "uk_ropewikiPage_pageId" UNIQUE ("pageId");

ALTER TABLE "RopewikiPageBetaSection"
    ADD CONSTRAINT "uk_ropewikiPageBetaSection_ropewikiPage_title" 
    UNIQUE ("ropewikiPage", "title");

ALTER TABLE "RopewikiImage"
    ADD CONSTRAINT "uk_ropewikiImage_ropewikiPage_betaSection_fileUrl" 
    UNIQUE ("ropewikiPage", "betaSection", "fileUrl");

-- Indexes
CREATE INDEX "RopewikiPage_pageId_index" ON "RopewikiPage" ("pageId");

-- migrate:down

DROP INDEX IF EXISTS "RopewikiPage_pageId_index";

ALTER TABLE "RopewikiImage" DROP CONSTRAINT IF EXISTS "uk_ropewikiImage_ropewikiPage_betaSection_fileUrl";
ALTER TABLE "RopewikiPageBetaSection" DROP CONSTRAINT IF EXISTS "uk_ropewikiPageBetaSection_ropewikiPage_title";
ALTER TABLE "RopewikiPage" DROP CONSTRAINT IF EXISTS "uk_ropewikiPage_pageId";
ALTER TABLE "RopewikiRegion" DROP CONSTRAINT IF EXISTS "uk_ropewikiRegion_name";

ALTER TABLE "RopewikiImage" DROP CONSTRAINT IF EXISTS "fk_ropewikiImage_betaSection";
ALTER TABLE "RopewikiImage" DROP CONSTRAINT IF EXISTS "fk_ropewikiImage_ropewikiPage";
ALTER TABLE "RopewikiPageBetaSection" DROP CONSTRAINT IF EXISTS "fk_ropewikiPageBetaSection_ropewikiPage";
ALTER TABLE "RopewikiPage" DROP CONSTRAINT IF EXISTS "fk_ropewikiPage_region";
ALTER TABLE "RopewikiRegion" DROP CONSTRAINT IF EXISTS "fk_ropewikiRegion_parentRegion";

DROP TABLE IF EXISTS "RopewikiImage";
DROP TABLE IF EXISTS "RopewikiPageBetaSection";
DROP TABLE IF EXISTS "RopewikiPage";
DROP TABLE IF EXISTS "RopewikiRegion";
