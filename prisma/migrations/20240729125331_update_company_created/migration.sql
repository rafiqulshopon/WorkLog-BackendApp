-- DropForeignKey
ALTER TABLE "UserToCompany" DROP CONSTRAINT "UserToCompany_companyId_fkey";

-- DropForeignKey
ALTER TABLE "UserToCompany" DROP CONSTRAINT "UserToCompany_userId_fkey";

-- AddForeignKey
ALTER TABLE "UserToCompany" ADD CONSTRAINT "UserToCompany_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserToCompany" ADD CONSTRAINT "UserToCompany_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
