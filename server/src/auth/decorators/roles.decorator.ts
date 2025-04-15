import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify required roles for route access
 * @param roles - Array of role names required to access a route
 * @example
 * @Roles('ADMIN', 'MANAGER')
 * @Get('admin-resource')
 * getAdminResource() {}
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles); 