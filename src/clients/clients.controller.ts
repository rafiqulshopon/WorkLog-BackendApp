import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
  ParseIntPipe,
  Param,
  Delete,
  Patch,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GetClientsDto } from './dto/get-clients.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @Roles('admin')
  async getAllClients(
    @Query('skip', new ParseIntPipe({ optional: true })) skip: number = 0,
    @Query('take', new ParseIntPipe({ optional: true })) take: number = 10,
    @Query() query: GetClientsDto,
    @Req() req,
  ) {
    return this.clientsService.getAllClients(
      query,
      req.user.companyId,
      skip,
      take,
    );
  }

  @Get(':id')
  @Roles('admin')
  async getClientById(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.clientsService.getClientById(id, req.user.companyId);
  }

  @Post()
  @Roles('admin')
  async createClient(@Body() createClientDto: CreateClientDto, @Req() req) {
    return this.clientsService.createClient(
      createClientDto,
      req.user.companyId,
    );
  }

  @Patch(':id')
  @Roles('admin')
  async updateClient(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClientDto: UpdateClientDto,
    @Req() req,
  ) {
    return this.clientsService.updateClient(
      id,
      updateClientDto,
      req.user.companyId,
    );
  }

  @Delete(':id')
  @Roles('admin')
  async deleteClientById(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.clientsService.deleteClientById(id, req.user.companyId);
  }
}
