import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { AuthService } from '../auth.service';

@Injectable()
export class AuthGuard implements CanActivate {

  constructor( private jwtService : JwtService,
               private authService : AuthService ){};

  async canActivate( context: ExecutionContext):Promise<boolean>{

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      throw new UnauthorizedException('There isnt a bearer token');
    }
    try {
      const payload = await this.jwtService.verifyAsync(
        token,
        {
          secret: process.env.SECRET_SEED
        }
      );      
      // 💡 We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      const user = await this.authService.findUserById(payload.id);      
      if( !user) throw new UnauthorizedException('USER DOESNT EXIST');
      if( !user.isActive) throw new UnauthorizedException('USER IS INACTIVE');
      request['user'] = user;      

    } catch(error) {
      if (error instanceof UnauthorizedException) {
        // If it's already an UnauthorizedException, rethrow it
        throw error;
      } else {
        // If it's a different type of error, throw a generic unauthorized exception
        throw new UnauthorizedException('Invalid bearer token');
      }
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers['authorization']?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
