import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { InviteUserDto } from './dto/invite-user.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { RegisterUserDto } from './dto/register-user.dto';

@Controller('users')
export class UsersController {
  constructor(private userService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req): Promise<UserProfileDto> {
    return this.userService.getProfile(req.user.userId, req.user.companyId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('invite')
  async inviteUser(@Body() inviteUserDto: InviteUserDto, @Req() req) {
    return this.userService.inviteUser(inviteUserDto, req.user);
  }

  @Post('register')
  async registerInvitedUser(@Body() registerUserDto: RegisterUserDto) {
    return this.userService.registerInvitedUser(registerUserDto);
  }
}
