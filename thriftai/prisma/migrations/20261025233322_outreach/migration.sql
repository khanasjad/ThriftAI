-- CreateTable
CREATE TABLE "public"."outreach_targets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "segment" TEXT,
    "website" TEXT,
    "status" TEXT NOT NULL DEFAULT 'target',
    "scorecardSentAt" TIMESTAMP(3),
    "nextStep" TEXT,
    "notes" TEXT,
    "owner" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outreach_targets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "outreach_targets_status_idx" ON "public"."outreach_targets"("status");

