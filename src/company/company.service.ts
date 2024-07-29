import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { Company } from '@prisma/client';
import { GetCompaniesDto } from './dto/get-companies.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

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

  async checkSlugAvailability(slug: string): Promise<{
    available: boolean;
    status: string | null;
    comapnyId: number | null;
  }> {
    const company = await this.prisma.company.findUnique({
      where: { slug },
    });

    if (!company) {
      return { available: true, status: null, comapnyId: null };
    }

    const status = company.isActive ? 'active' : 'disabled';
    return { available: false, status, comapnyId: company.id };
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
        createdBy: {
          connect: {
            id: userId,
          },
        },
      },
    });
  }

  async deleteCompanyById(id: number): Promise<{ message: string }> {
    const company = await this.prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    await this.prisma.company.delete({
      where: { id },
    });

    return { message: `Company with ID ${id} successfully deleted` };
  }

  async updateCompanyInfo(
    id: number,
    updateCompanyDto: UpdateCompanyDto,
  ): Promise<Company> {
    const existingCompany = await this.prisma.company.findUnique({
      where: { id },
    });

    if (!existingCompany) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    if (
      updateCompanyDto.slug &&
      updateCompanyDto.slug !== existingCompany.slug
    ) {
      const slugExists = await this.prisma.company.findUnique({
        where: { slug: updateCompanyDto.slug },
      });

      if (slugExists) {
        throw new ConflictException('Slug is already taken');
      }
    }

    const updatedCompany = await this.prisma.company.update({
      where: { id },
      data: updateCompanyDto,
    });

    return updatedCompany;
  }

  async updateCompanyStatus(
    id: number,
    isActive: boolean,
  ): Promise<{ message: string }> {
    const company = await this.prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    if (company.isActive === isActive) {
      throw new ConflictException(
        `Company is already ${isActive ? 'active' : 'inactive'}`,
      );
    }

    await this.prisma.company.update({
      where: { id },
      data: { isActive },
    });

    return {
      message: `Company status updated to ${isActive ? 'active' : 'inactive'}`,
    };
  }
}
