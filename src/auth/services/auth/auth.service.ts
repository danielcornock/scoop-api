import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { compare, hash } from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';
import { Model } from 'mongoose';
import { IDecodedJwt, IJwtConfig } from 'src/auth/interfaces/jwt-config.interface';
import { User } from 'src/auth/schemas/user.schema';
import { CreateUserRequest } from 'src/auth/transfer-objects/create-user.dto';
import { DatabaseErrorsService } from 'src/common/services/database-errors/database-errors.service';
import { Maybe } from 'src/common/types/maybe';
import { promisify } from 'util';

@Injectable()
export class AuthService {
  @InjectModel(User.name)
  private readonly _userRepo: Model<User>;

  public async getFullUserByEmail(email: string): Promise<User> {
    const user: Maybe<User> = await this._userRepo.findOne({ email });

    if (!user) {
      throw new NotFoundException('No user found with this email address.');
    }

    return user;
  }

  public async getUserById(id: string): Promise<User> {
    const user: Maybe<User> = await this._userRepo
      .findById(id)
      .select('-password');

    if (!user) {
      throw new NotFoundException('This user no longer exists.');
    }

    return user;
  }

  public async createUser(userObject: CreateUserRequest): Promise<User> {
    try {
      const encryptedPassword: string = await this._hashPassword(
        userObject.password,
      );
      const updatedUserObject: CreateUserRequest = {
        ...userObject,
        password: encryptedPassword,
      };

      const createdUser: User = await this._userRepo.create(updatedUserObject);

      return createdUser;
    } catch (e) {
      DatabaseErrorsService.handle(e);
    }
  }

  public isPasswordMatch(
    testPassword: string,
    controlPassword: string,
  ): Promise<boolean> {
    return compare(testPassword, controlPassword);
  }

  public generateJwt(jwtConfig: IJwtConfig): string {
    return sign(jwtConfig.payload, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn,
    });
  }

  public generateSecret(id: string, secret: string): string {
    return sign({ id }, secret);
  }

  public decodeJwt(rawToken: string, secret: string): Promise<IDecodedJwt> {
    const bearerToken: Maybe<string> = this.getToken(rawToken);
    const jwtVerify = promisify<string, string, string>(verify);

    return (jwtVerify(bearerToken, secret) as unknown) as Promise<IDecodedJwt>;
  }

  public getToken(token: string): Maybe<string> {
    if (token && token.startsWith('Bearer')) {
      return token.split(' ')[1];
    } else {
      throw new UnauthorizedException('Invalid authentication token.');
    }
  }

  private _hashPassword(password: string, strength?: number): Promise<string> {
    return hash(password, strength || 10);
  }
}
