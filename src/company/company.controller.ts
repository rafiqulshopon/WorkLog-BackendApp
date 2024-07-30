import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  Query,
  Param,
  Delete,
  Patch,
} from '@nestjs/common';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetCompaniesDto } from './dto/get-companies.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Company } from '@prisma/client';

@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get('check-slug')
  async checkSlugAvailability(@Query('slug') slug: string) {
    return this.companyService.checkSlugAvailability(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getCompanies(@Query() query: GetCompaniesDto) {
    return this.companyService.getCompanies(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getCompanyById(@Param('id') id: string) {
    const companyId = parseInt(id, 10);
    return this.companyService.getCompanyById(companyId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  async create(@Body() createCompanyDto: CreateCompanyDto, @Req() req) {
    return this.companyService.createCompany(createCompanyDto, req.user.userId);
  }

  @Delete(':id')
  async deleteCompanyById(@Param('id') id: string) {
    const companyId = parseInt(id, 10);
    return this.companyService.deleteCompanyById(companyId);
  }

  @Patch(':id')
  async updateCompany(
    @Param('id') id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ): Promise<Company> {
    const companyId = parseInt(id, 10);
    return this.companyService.updateCompanyInfo(companyId, updateCompanyDto);
  }

  @Patch(':id/status')
  async updateCompanyStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    const companyId = parseInt(id, 10);
    return this.companyService.updateCompanyStatus(companyId, isActive);
  }
}
