import {
  Injectable,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { GetClientsDto } from './dto/get-clients.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllClients(
    query: GetClientsDto,
    companyId: number,
    skip: number,
    take: number,
  ) {
    const { search, primaryContactEmail, primaryContactPhone } = query;

    const where: any = { companyId };

    console.log({ companyId });

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { primaryContactName: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (primaryContactEmail) {
      where.primaryContactEmail = {
        contains: primaryContactEmail,
        mode: 'insensitive',
      };
    }

    if (primaryContactPhone) {
      where.primaryContactPhone = {
        contains: primaryContactPhone,
        mode: 'insensitive',
      };
    }

    const [clients, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
      }),
      this.prisma.client.count({ where }),
    ]);

    return {
      data: clients,
      total,
      skip,
      take,
    };
  }

  async getClientById(id: number, companyId: number) {
    const client = await this.prisma.client.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!client) {
      throw new BadRequestException('Client not found');
    }

    return client;
  }

  async createClient(createClientDto: CreateClientDto, companyId: number) {
    const { ...clientData } = createClientDto;

    try {
      const companyExists = await this.prisma.company.findUnique({
        where: { id: companyId },
      });

      if (!companyExists) {
        throw new BadRequestException('Invalid company ID');
      }

      const client = await this.prisma.client.create({
        data: {
          ...clientData,
          companyId,
        },
      });

      return { message: 'Client created successfully', client };
    } catch (error) {
      this.handleCreateClientError(error);
    }
  }

  private handleCreateClientError(error: any): void {
    if (error.code === 'P2002') {
      if (error.meta.target.includes('primaryContactEmail')) {
        throw new ConflictException(
          'A client with this primary contact email already exists.',
        );
      }
      if (error.meta.target.includes('companyEmail')) {
        throw new ConflictException(
          'A client with this company email already exists.',
        );
      }
    }

    if (
      error.response?.statusCode === 400 &&
      error.response?.message === 'Invalid company ID'
    ) {
      throw new BadRequestException('Invalid company ID');
    }

    throw new InternalServerErrorException(
      'An error occurred while processing your request.',
    );
  }

  async deleteClientById(id: number, companyId: number) {
    const client = await this.prisma.client.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!client) {
      throw new BadRequestException('Client not found');
    }

    await this.prisma.client.delete({
      where: {
        id,
        companyId,
      },
    });

    return { message: 'Client deleted successfully' };
  }
}
