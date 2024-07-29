import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { VerifyOtpDto } from './dto/verfiy-user.dto';
import { ValidateLoginUserDto } from './dto/validate-login-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signup(@Body() createUserDto: CreateUserDto) {
    return this.authService.signup(createUserDto);
  }

  @Post('verify')
  async verify(@Body() verifyOtpDto: VerifyOtpDto) {
    const { email, otp, companyId } = verifyOtpDto;
    return this.authService.verifyOtp(email, otp, companyId);
  }

  @Post('login')
  async login(
    @Body()
    loginUserDto: ValidateLoginUserDto,
  ) {
    const { email, password, companyId } = loginUserDto;
    return this.authService.handleUserLogin(email, password, companyId);
  }
}
