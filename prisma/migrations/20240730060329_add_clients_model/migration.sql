-- CreateTable
CREATE TABLE "Client" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "primaryContactName" TEXT NOT NULL,
    "primaryContactEmail" TEXT,
    "primaryContactPhone" TEXT,
    "companyEmail" TEXT,
    "documents" TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_primaryContactEmail_companyEmail_key" ON "Client"("primaryContactEmail", "companyEmail");
