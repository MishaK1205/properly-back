import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { Admin, AdminDocument } from './schemas/admin.schema';

const BCRYPT_ROUNDS = 12;

/**
 * Creates the initial admin account from ADMIN_EMAIL / ADMIN_PASSWORD
 * on first boot, so the API is never left without a way to log in.
 */
@Injectable()
export class AdminSeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminSeederService.name);

  constructor(
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const existingAdmins = await this.adminModel
      .estimatedDocumentCount()
      .exec();
    if (existingAdmins > 0) {
      return;
    }

    const email = this.configService.get<string>('ADMIN_EMAIL');
    const password = this.configService.get<string>('ADMIN_PASSWORD');
    if (!email || !password) {
      this.logger.warn(
        'No admin exists and ADMIN_EMAIL / ADMIN_PASSWORD are not set — login will be impossible.',
      );
      return;
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await this.adminModel.create({ email: email.toLowerCase(), passwordHash });
    this.logger.log(`Seeded initial admin account: ${email}`);
  }
}
