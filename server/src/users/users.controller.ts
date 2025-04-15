import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Param, 
  Body, 
  Query, 
  Req, 
  UseGuards,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get all users for the current practice with optional filters
   */
  @Get()
  @Roles('PRACTICE_OWNER', 'VETERINARIAN')
  async findAll(@Query() query: ListUsersQueryDto, @Req() req: any) {
    const practiceId = req.user.practiceId;
    return this.usersService.findAll(practiceId, query);
  }

  /**
   * Get a specific user by ID
   */
  @Get(':id')
  @Roles('PRACTICE_OWNER', 'VETERINARIAN')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const practiceId = req.user.practiceId;
    return this.usersService.findById(id, practiceId);
  }

  /**
   * Create a new user
   */
  @Post()
  @Roles('PRACTICE_OWNER')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto, @Req() req: any) {
    const practiceId = req.user.practiceId;
    const result = await this.usersService.create(createUserDto, practiceId);
    return {
      status: 'success',
      message: 'User created successfully',
      data: result
    };
  }

  /**
   * Update a user's information
   */
  @Put(':id')
  @Roles('PRACTICE_OWNER')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: any
  ) {
    const practiceId = req.user.practiceId;
    const result = await this.usersService.update(id, updateUserDto, practiceId);
    return {
      status: 'success',
      message: 'User updated successfully',
      data: result
    };
  }

  /**
   * Update own password (current user)
   */
  @Put('password/update')
  @HttpCode(HttpStatus.OK)
  async updatePassword(
    @Body() updatePasswordDto: UpdatePasswordDto,
    @Req() req: any
  ) {
    const userId = req.user.id;
    const practiceId = req.user.practiceId;
    const result = await this.usersService.updatePassword(
      userId, 
      updatePasswordDto.currentPassword,
      updatePasswordDto.newPassword,
      practiceId
    );
    return {
      status: 'success',
      message: 'Password updated successfully'
    };
  }

  /**
   * Reset a user's password (admin function)
   */
  @Put(':id/password/reset')
  @Roles('PRACTICE_OWNER')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Param('id') id: string,
    @Body() resetPasswordDto: ResetPasswordDto,
    @Req() req: any
  ) {
    const practiceId = req.user.practiceId;
    const result = await this.usersService.resetPassword(
      id,
      resetPasswordDto.newPassword,
      practiceId
    );
    return {
      status: 'success',
      message: 'Password reset successfully'
    };
  }

  /**
   * Delete a user (soft delete by setting isActive to false)
   */
  @Delete(':id')
  @Roles('PRACTICE_OWNER')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @Req() req: any) {
    const practiceId = req.user.practiceId;
    const result = await this.usersService.softDelete(id, practiceId);
    return {
      status: 'success',
      message: 'User deactivated successfully'
    };
  }
} 