import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  Query,
  Param,
} from '@nestjs/common';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetCompaniesDto } from './dto/get-companies.dto';

@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getCompanies(@Query() query: GetCompaniesDto) {
    console.log(query);

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
}
