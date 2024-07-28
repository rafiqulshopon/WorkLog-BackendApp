import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { PrismaService } from '../prisma/prisma.service';

import { RegisterUserDto } from './dto/register-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private prisma: PrismaService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const result = { ...user };
    delete result.password;
    return result;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
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
      },
    };
  }

  async signup(user: CreateUserDto) {
    const createdUser = await this.usersService.createUser(user);

    await this.emailService.sendVerificationEmail(
      createdUser.firstName,
      createdUser.email,
      createdUser.otp,
    );

    return { message: 'Verification email sent. Please check your inbox.' };
  }

  async verifyOtp(email: string, otp: string) {
    const user = await this.usersService.verifyOtp(email, otp);
    if (!user) {
      throw new UnauthorizedException('Invalid OTP');
    }
    return { message: 'Your account has been successfully verified.' };
  }

  async getProfile(userId: number): Promise<UserProfileDto> {
    const user = await this.usersService.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const profile = { ...user };
    delete profile.password;
    delete profile.otp;
    delete profile.otpExpiration;
    return {
      message: 'Profile fetched successfully',
      data: profile,
    };
  }

  async registerInvitedUser(registerUserDto: RegisterUserDto) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token: registerUserDto.token },
    });

    if (!invitation || invitation.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired invitation token');
    }

    if (invitation.email !== registerUserDto.email) {
      throw new ConflictException('Email does not match the invitation');
    }

    const createdUser = await this.usersService.createUser({
      username: registerUserDto.username,
      email: registerUserDto.email,
      password: registerUserDto.password,
      firstName: registerUserDto.firstName,
      lastName: registerUserDto.lastName,
      address: registerUserDto.address,
      role: invitation.role,
      verified: true,
      otp: null,
      otpExpiration: null,
    });

    await this.prisma.invitation.delete({
      where: { token: registerUserDto.token },
    });

    return {
      message: 'Registration successful',
      data: {
        id: createdUser.id,
        username: createdUser.username,
        email: createdUser.email,
        firstName: createdUser.firstName,
        lastName: createdUser.lastName,
        role: createdUser.role,
      },
    };
  }
}
