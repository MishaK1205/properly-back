import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Res,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { ObjectIdPipe } from '../common/pipes/object-id.pipe';
import { IMAGE_FIELD_NAME, MAX_IMAGES_PER_UPLOAD } from './images.constants';
import { ImagesService } from './images.service';

@ApiTags('images')
@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  /** Upload one or more images (multipart form, field name "images"). */
  @Post()
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        [IMAGE_FIELD_NAME]: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor(IMAGE_FIELD_NAME, MAX_IMAGES_PER_UPLOAD))
  upload(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException(
        `No files received — send images in the "${IMAGE_FIELD_NAME}" field`,
      );
    }
    return this.imagesService.createMany(files);
  }

  @Get()
  @ApiBearerAuth('access-token')
  findAll() {
    return this.imagesService.findAll();
  }

  /** Publicly serves the binary image file. */
  @Public()
  @Get(':id')
  @ApiOkResponse({ description: 'The binary image file' })
  async findOne(
    @Param('id', ObjectIdPipe) id: string,
    @Res() res: Response,
  ): Promise<void> {
    const { stream, image } = await this.imagesService.getFileStream(id);
    res.setHeader('Content-Type', image.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(image.originalName)}"`,
    );
    stream.pipe(res);
  }

  /** Replaces the stored file for an existing image id. */
  @Put(':id')
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        [IMAGE_FIELD_NAME]: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor(IMAGE_FIELD_NAME))
  replace(
    @Param('id', ObjectIdPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException(
        `No file received — send an image in the "${IMAGE_FIELD_NAME}" field`,
      );
    }
    return this.imagesService.replace(id, file);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  remove(@Param('id', ObjectIdPipe) id: string) {
    return this.imagesService.remove(id);
  }
}
