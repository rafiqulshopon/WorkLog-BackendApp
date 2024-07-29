import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { Company } from '@prisma/client';

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

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
