import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const { password: userPassword, ...result } = user;
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
    // Create the user with OTP
    const createdUser = await this.usersService.createUser(user);

    // Send OTP via email
    await this.emailService.sendVerificationEmail(
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
}
