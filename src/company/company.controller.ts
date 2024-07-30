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
  ParseIntPipe,
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
  async getCompanyById(@Param('id', ParseIntPipe) id: number) {
    return this.companyService.getCompanyById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  async create(@Body() createCompanyDto: CreateCompanyDto, @Req() req) {
    return this.companyService.createCompany(createCompanyDto, req.user.userId);
  }

  @Delete(':id')
  async deleteCompanyById(@Param('id', ParseIntPipe) id: number) {
    return this.companyService.deleteCompanyById(id);
  }

  @Patch(':id')
  async updateCompany(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ): Promise<Company> {
    return this.companyService.updateCompanyInfo(id, updateCompanyDto);
  }

  @Patch(':id/status')
  async updateCompanyStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('isActive') isActive: boolean,
  ) {
    return this.companyService.updateCompanyStatus(id, isActive);
  }
}
