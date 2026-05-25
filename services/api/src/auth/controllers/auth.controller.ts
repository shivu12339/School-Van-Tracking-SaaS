import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Public } from '../decorators/public.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { LoginDto } from '../dto/login.dto';
import { LogoutDto } from '../dto/logout.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { LoginResponseDto, TokenPairResponseDto, AuthUserResponseDto } from '../dto/auth-response.dto';
import { DeviceSessionResponseDto, RevokeDeviceSessionDto } from '../dto/device-session.dto';
import { AuthService } from '../services/auth.service';
import { AuthUser } from '../types/auth-user.type';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import { RefreshTokenGuard } from '../guards/refresh-token.guard';
import { REFRESH_COOKIE_NAME } from '../constants/auth.constants';
import { clearRefreshTokenCookie, extractRefreshToken, setRefreshTokenCookie } from '../utils/cookie.util';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private extractMeta(req: Request): { ipAddress?: string; userAgent?: string } {
    return {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Login with email/password' })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto, this.extractMeta(req));
    if (dto.useCookies) {
      setRefreshTokenCookie(res, result.refreshToken, this.configService);
    }
    return result;
  }

  @Public()
  @UseGuards(RefreshTokenGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Rotate refresh token and issue new access token' })
  @ApiCookieAuth(REFRESH_COOKIE_NAME)
  @ApiResponse({ status: 200, type: TokenPairResponseDto })
  @Post('refresh')
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken =
      extractRefreshToken(dto.refreshToken, req.cookies as Record<string, string>) ?? '';
    const tokens = await this.authService.refresh(refreshToken, this.extractMeta(req));
    if (req.cookies?.[REFRESH_COOKIE_NAME] || dto.refreshToken) {
      setRefreshTokenCookie(res, tokens.refreshToken, this.configService);
    }
    return tokens;
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout current device session' })
  @Post('logout')
  async logout(
    @CurrentUser() user: AuthUser,
    @Body() dto: LogoutDto,
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = extractRefreshToken(
      dto.refreshToken,
      req.cookies as Record<string, string>,
    );
    await this.authService.logout(user, refreshToken, this.extractMeta(req));
    clearRefreshTokenCookie(res);
    return { success: true };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout all active sessions for user' })
  @Post('logout-all')
  async logoutAll(
    @CurrentUser() user: AuthUser,
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logoutAll(user, this.extractMeta(req));
    clearRefreshTokenCookie(res);
    return { success: true };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get authenticated profile' })
  @ApiResponse({ status: 200, type: AuthUserResponseDto })
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.authService.me(user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'List active device sessions' })
  @ApiResponse({ status: 200, type: [DeviceSessionResponseDto] })
  @Get('sessions')
  sessions(@CurrentUser() user: AuthUser) {
    return this.authService.listDeviceSessions(user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a specific device session' })
  @Delete('sessions/:deviceId')
  revokeSession(
    @CurrentUser() user: AuthUser,
    @Param('deviceId') deviceId: string,
  ) {
    return this.authService.revokeDeviceSession(user, deviceId);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke session by device id (body)' })
  @Post('sessions/revoke')
  revokeSessionBody(
    @CurrentUser() user: AuthUser,
    @Body() dto: RevokeDeviceSessionDto,
  ) {
    return this.authService.revokeDeviceSession(user, dto.deviceId);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password for authenticated user' })
  @Post('change-password')
  changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user, dto);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @ApiOperation({ summary: 'Request password reset token' })
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Reset password using reset token' })
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
