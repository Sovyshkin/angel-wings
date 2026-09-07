ALTER TABLE "products" ADD COLUMN "featuredPosition" INTEGER;

WITH ranked_featured AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (ORDER BY "createdAt" DESC, "id" DESC) AS position
  FROM "products"
  WHERE "featured" = true AND "active" = true
)
UPDATE "products"
SET "featuredPosition" = (
  SELECT position
  FROM ranked_featured
  WHERE ranked_featured."id" = "products"."id"
)
WHERE "id" IN (
  SELECT "id"
  FROM ranked_featured
  WHERE position <= 4
);

UPDATE "products"
SET "featured" = false, "featuredPosition" = NULL
WHERE "featured" = true AND "featuredPosition" IS NULL;

CREATE UNIQUE INDEX "products_featuredPosition_key"
ON "products"("featuredPosition");
