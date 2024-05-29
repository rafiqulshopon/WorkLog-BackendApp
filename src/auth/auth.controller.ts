import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signup(@Body() createUserDto: any) {
    return this.authService.signup(createUserDto);
  }

  @Post('verify')
  async verify(@Body() verifyOtpDto: any) {
    const { email, otp } = verifyOtpDto;
    const user = await this.authService.verifyOtp(email, otp);
    if (!user) {
      throw new UnauthorizedException('Invalid OTP');
    }
    return user;
  }

  @Post('login')
  async login(@Body() loginUserDto: any) {
    const user = await this.authService.validateUser(
      loginUserDto.email,
      loginUserDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.authService.login(user);
  }
}
