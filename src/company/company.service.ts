import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { Company } from '@prisma/client';
import { GetCompaniesDto } from './dto/get-companies.dto';

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

  async getCompanies(query: GetCompaniesDto) {
    const { search, industry, skip = '0', take = '10' } = query;

    const skipInt = parseInt(skip as string, 10);
    const takeInt = parseInt(take as string, 10);

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (industry) {
      where.industry = { contains: industry, mode: 'insensitive' };
    }

    const [companies, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip: skipInt,
        take: takeInt,
        orderBy: { name: 'asc' },
      }),
      this.prisma.company.count({ where }),
    ]);

    return {
      data: companies,
      total,
      skip: skipInt,
      take: takeInt,
    };
  }

  async getCompanyById(id: number): Promise<Company> {
    const company = await this.prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    return company;
  }

  async createCompany(
    createCompanyDto: CreateCompanyDto,
    userId: number,
  ): Promise<Company> {
    const { name, slug } = createCompanyDto;

    const existingCompany = await this.prisma.company.findFirst({
      where: {
        OR: [{ name }, { slug }],
      },
    });

    if (existingCompany) {
      throw new ConflictException('Company name or slug already exists');
    }

    return this.prisma.company.create({
      data: {
        ...createCompanyDto,
        size: createCompanyDto.size.toString(),
        createdBy: {
          connect: {
            id: userId,
          },
        },
      },
    });
  }
}
