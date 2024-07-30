import {
  Injectable,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async createClient(createClientDto: CreateClientDto) {
    const { companyId, ...clientData } = createClientDto;

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
}
