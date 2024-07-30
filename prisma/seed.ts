import { PrismaClient } from '@prisma/client';
import { companies } from '../src/common/dummy-data/company-data';

const prisma = new PrismaClient();

async function main() {
  await prisma.company.createMany({
    data: companies,
  });
  console.log('Companies have been added to the database');
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
