import { BadRequestException, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, resolve } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { MAX_IMAGE_SIZE_BYTES } from './images.constants';
import { ImagesController } from './images.controller';
import { ImagesService } from './images.service';
import { Image, ImageSchema } from './schemas/image.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Image.name, schema: ImageSchema }]),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const uploadDir = resolve(
          configService.get<string>('UPLOAD_DIR', './uploads'),
        );
        mkdirSync(uploadDir, { recursive: true });

        return {
          storage: diskStorage({
            destination: uploadDir,
            filename: (_req, file, callback) => {
              callback(
                null,
                `${uuidv4()}${extname(file.originalname).toLowerCase()}`,
              );
            },
          }),
          fileFilter: (_req, file, callback) => {
            if (!file.mimetype.startsWith('image/')) {
              return callback(
                new BadRequestException('Only image files are allowed'),
                false,
              );
            }
            callback(null, true);
          },
          limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
        };
      },
    }),
  ],
  controllers: [ImagesController],
  providers: [ImagesService],
  exports: [ImagesService],
})
export class ImagesModule {}
