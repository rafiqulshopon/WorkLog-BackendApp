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
    const existingUser = await this.prisma.userToCompany.findFirst({
      where: {
        companyId: data.companyId,
        user: {
          email: data.email,
        },
      },
      include: {
        user: true,
      },
    });

    if (existingUser) {
      throw new ConflictException(
        `User with email ${data.email} already exists in the company.`,
      );
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

  async findUserByEmail(
    email: string,
    companyId: number,
  ): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        email,
        companyId,
      },
    });
  }

  async findUserById(id: number, companyId: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id, companyId },
    });
  }

  async getProfile(userId: number, companyId: number): Promise<UserProfileDto> {
    const user = await this.findUserById(userId, companyId);
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

    const company = await this.prisma.company.findUnique({
      where: { id: inviteUserDto.companyId },
    });

    if (!company) {
      throw new BadRequestException('Invalid company ID');
    }

    const existingUser = await this.prisma.user.findFirst({
      where: { email: inviteUserDto.email },
    });

    if (existingUser) {
      const existingUserInCompany = await this.prisma.userToCompany.findFirst({
        where: {
          userId: existingUser.id,
          companyId: inviteUserDto.companyId,
        },
      });

      if (existingUserInCompany) {
        throw new ConflictException(
          'User with this email already exists in the company',
        );
      }
    }

    const existingInvitation = await this.prisma.invitation.findFirst({
      where: {
        email: inviteUserDto.email,
        companyId: inviteUserDto.companyId,
      },
    });

    if (existingInvitation) {
      throw new ConflictException(
        'An invitation with this email already exists for this company',
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
        companyId: inviteUserDto.companyId,
      },
    });

    await this.emailService.sendInvitationEmail(
      inviteUserDto.email,
      token,
      company.slug,
    );

    return { message: 'Invitation sent successfully' };
  }

  async generateOtp(email: string, companyId: number): Promise<string> {
    const user = await this.findUserByEmail(email, companyId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const otp = crypto.randomBytes(3).toString('hex');
    const otpExpiration = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

    await this.prisma.user.update({
      where: { id: user.id },
      data: { otp, otpExpiration },
    });

    return otp;
  }

  async verifyOtp(
    email: string,
    otp: string,
    companyId: number,
  ): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        companyId,
      },
    });

    if (user.companyId !== companyId) {
      throw new UnauthorizedException('Invalid company ID');
    }

    if (!user || user.otp !== otp || user.otpExpiration <= new Date()) {
      throw new NotFoundException('Invalid OTP or OTP has expired');
    }

    return this.prisma.user.update({
      where: { id: user.id },
      data: { verified: true, otp: null, otpExpiration: null },
    });
  }

  async registerInvitedUser(registerUserDto: RegisterUserDto) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token: registerUserDto.token },
      include: { company: true },
    });

    if (!invitation || invitation.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired invitation token');
    }

    if (invitation.email !== registerUserDto.email) {
      throw new ConflictException('Email does not match the invitation');
    }

    if (invitation.companyId !== registerUserDto.companyId) {
      throw new ConflictException(
        'The company ID does not match the invitation',
      );
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
      companyId: registerUserDto.companyId,
    });

    await this.prisma.userToCompany.create({
      data: {
        userId: createdUser.id,
        companyId: invitation.companyId,
      },
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
