import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private prisma: PrismaService,
  ) {}

  async handleUserLogin(
    email: string,
    password: string,
    companyId: number,
  ): Promise<any> {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          email,
          companyId,
        },
      });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new UnauthorizedException('Invalid email or password');
      }

      if (user.companyId !== companyId) {
        throw new UnauthorizedException('Invalid company ID');
      }

      const payload = {
        email: user.email,
        userId: user.id,
        role: user.role,
        companyId,
      };

      return {
        message: 'Login successful',
        access_token: this.jwtService.sign(payload),
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          companyId: user.companyId,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        return {
          error: 'Unauthorized',
          message: error.message,
          statusCode: 401,
        };
      }

      throw new UnauthorizedException('Error logging in user');
    }
  }

  async signup(user: CreateUserDto) {
    const companyExists = await this.prisma.company.findUnique({
      where: { id: user.companyId },
    });

    if (!companyExists) {
      throw new BadRequestException('Invalid company ID');
    }

    try {
      const createdUser = await this.usersService.createUser(user);

      await this.emailService.sendVerificationEmail(
        createdUser.firstName,
        createdUser.email,
        createdUser.otp,
        companyExists.slug,
      );

      return { message: 'Verification email sent. Please check your inbox.' };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      } else {
        throw new InternalServerErrorException(
          'An unexpected error occurred during user creation.',
        );
      }
    }
  }

  async verifyOtp(email: string, otp: string, companyId: number) {
    const user = await this.usersService.verifyOtp(email, otp, companyId);

    if (!user) {
      throw new BadRequestException('Invalid OTP or OTP has expired');
    }

    return { message: 'Your account has been successfully verified.' };
  }
}
