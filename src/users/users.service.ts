import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { EmailService } from '../email/email.service';
import { UserRole } from './user-role.enum';
import { UserProfileDto } from './dto/user-profile.dto';
import { RegisterUserDto } from './dto/register-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }],
      },
    });

    if (existingUser) {
      throw new ConflictException('Username or email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        otp:
          data.otp === null
            ? null
            : data.otp || crypto.randomBytes(3).toString('hex'),
        otpExpiration:
          data.otpExpiration === null
            ? null
            : data.otpExpiration || new Date(Date.now() + 10 * 60 * 1000),
      },
    });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findUserById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async getProfile(userId: number): Promise<UserProfileDto> {
    const user = await this.findUserById(userId);
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

  async inviteUser(inviteUserDto: InviteUserDto, currentUser: any) {
    if (currentUser.role !== 'admin') {
      throw new UnauthorizedException('Only admins can invite users');
    }

    if (!Object.values(UserRole).includes(inviteUserDto.role)) {
      throw new BadRequestException('Invalid user role');
    }

    const existingUser = await this.findUserByEmail(inviteUserDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const existingInvitation = await this.prisma.invitation.findUnique({
      where: { email: inviteUserDto.email },
    });

    if (existingInvitation) {
      throw new ConflictException(
        'An invitation with this email already exists',
      );
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.invitation.create({
      data: {
        email: inviteUserDto.email,
        role: inviteUserDto.role,
        token,
        expiresAt,
      },
    });

    await this.emailService.sendInvitationEmail(inviteUserDto.email, token);

    return { message: 'Invitation sent successfully' };
  }

  async generateOtp(email: string): Promise<string> {
    const user = await this.findUserByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const otp = crypto.randomBytes(3).toString('hex');
    const otpExpiration = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

    await this.prisma.user.update({
      where: { email },
      data: { otp, otpExpiration },
    });

    return otp;
  }

  async verifyOtp(email: string, otp: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.otp !== otp || user.otpExpiration <= new Date()) {
      throw new NotFoundException('Invalid OTP or OTP has expired');
    }

    return this.prisma.user.update({
      where: { email },
      data: { verified: true, otp: null, otpExpiration: null },
    });
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

    const createdUser = await this.createUser({
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
