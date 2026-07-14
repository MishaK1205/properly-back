import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { createReadStream, existsSync } from 'fs';
import { unlink } from 'fs/promises';
import { Model } from 'mongoose';
import { join, resolve } from 'path';
import { Image, ImageDocument } from './schemas/image.schema';

@Injectable()
export class ImagesService {
  private readonly uploadDir: string;

  constructor(
    @InjectModel(Image.name) private readonly imageModel: Model<ImageDocument>,
    configService: ConfigService,
  ) {
    this.uploadDir = resolve(
      configService.get<string>('UPLOAD_DIR', './uploads'),
    );
  }

  async createMany(files: Express.Multer.File[]): Promise<ImageDocument[]> {
    try {
      return await this.imageModel.create(
        files.map((file) => ({
          originalName: file.originalname,
          filename: file.filename,
          mimeType: file.mimetype,
          size: file.size,
        })),
      );
    } catch {
      // If metadata could not be saved, don't leave orphan files on disk.
      await Promise.allSettled(
        files.map((file) => unlink(join(this.uploadDir, file.filename))),
      );
      throw new InternalServerErrorException('Failed to store uploaded images');
    }
  }

  findAll(): Promise<ImageDocument[]> {
    return this.imageModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<ImageDocument> {
    const image = await this.imageModel.findById(id).exec();
    if (!image) {
      throw new NotFoundException(`Image with id "${id}" not found`);
    }
    return image;
  }

  async getFileStream(
    id: string,
  ): Promise<{ stream: NodeJS.ReadableStream; image: ImageDocument }> {
    const image = await this.findOne(id);
    const filePath = join(this.uploadDir, image.filename);
    if (!existsSync(filePath)) {
      throw new NotFoundException(`File for image "${id}" is missing on disk`);
    }
    return { stream: createReadStream(filePath), image };
  }

  /** Replaces the stored file of an existing image with a newly uploaded one. */
  async replace(id: string, file: Express.Multer.File): Promise<ImageDocument> {
    const image = await this.findOne(id);
    const oldFilename = image.filename;

    image.originalName = file.originalname;
    image.filename = file.filename;
    image.mimeType = file.mimetype;
    image.size = file.size;
    await image.save();

    await unlink(join(this.uploadDir, oldFilename)).catch(() => undefined);
    return image;
  }

  async remove(id: string): Promise<void> {
    const image = await this.imageModel.findByIdAndDelete(id).exec();
    if (!image) {
      throw new NotFoundException(`Image with id "${id}" not found`);
    }
    await unlink(join(this.uploadDir, image.filename)).catch(() => undefined);
  }

  /** Returns true only if every given id belongs to an existing image. */
  async allExist(ids: string[]): Promise<boolean> {
    if (ids.length === 0) {
      return true;
    }
    const uniqueIds = [...new Set(ids)];
    const count = await this.imageModel
      .countDocuments({ _id: { $in: uniqueIds } })
      .exec();
    return count === uniqueIds.length;
  }
}
