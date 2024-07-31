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

      const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
      const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

      return {
        message: 'Login successful',
        access_token: accessToken,
        refresh_token: refreshToken,
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
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

  async refreshAccessToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const newAccessToken = this.jwtService.sign(
        {
          email: payload.email,
          userId: payload.userId,
          role: payload.role,
          companyId: payload.companyId,
        },
        { expiresIn: '1h' },
      );
      return {
        message: 'Access token refreshed successfully',
        data: {
          access_token: newAccessToken,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
