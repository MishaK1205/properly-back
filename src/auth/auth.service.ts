import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { LoginDto } from './dto/login.dto';
import { Admin, AdminDocument } from './schemas/admin.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<{ accessToken: string }> {
    const admin = await this.adminModel
      .findOne({ email: loginDto.email.toLowerCase() })
      .exec();

    const passwordMatches = admin
      ? await bcrypt.compare(loginDto.password, admin.passwordHash)
      : false;

    if (!admin || !passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload: JwtPayload = { sub: admin.id, email: admin.email };
    return { accessToken: await this.jwtService.signAsync(payload) };
  }
}
