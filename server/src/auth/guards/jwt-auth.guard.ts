import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor() {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext, status?: any) {
    // If authentication failed, throw an exception with more specific details
    if (err || !user) {
      if (info && info.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Your session has expired. Please login again.');
      }
      if (info && info.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid authentication token. Please login again.');
      }
      throw new UnauthorizedException('Unauthorized access. Please login to continue.');
    }
    
    // Return the user if authentication succeeded
    return user;
  }
} 