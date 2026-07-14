import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProjectsService } from '../projects/projects.service';
import { CreateGetInTouchDto } from './dto/create-get-in-touch.dto';
import { UpdateGetInTouchDto } from './dto/update-get-in-touch.dto';
import { GetInTouch, GetInTouchDocument } from './schemas/get-in-touch.schema';

@Injectable()
export class GetInTouchService {
  constructor(
    @InjectModel(GetInTouch.name)
    private readonly getInTouchModel: Model<GetInTouchDocument>,
    private readonly projectsService: ProjectsService,
  ) {}

  async create(
    createGetInTouchDto: CreateGetInTouchDto,
  ): Promise<GetInTouchDocument> {
    await this.assertProjectExists(createGetInTouchDto.project);
    return this.getInTouchModel.create(createGetInTouchDto);
  }

  findAll(): Promise<GetInTouchDocument[]> {
    return this.getInTouchModel
      .find()
      .sort({ createdAt: -1 })
      .populate(
        'project',
        'projectName projectLocationGe projectLocationEn projectLocationRu',
      )
      .exec();
  }

  async findOne(id: string): Promise<GetInTouchDocument> {
    const entry = await this.getInTouchModel
      .findById(id)
      .populate(
        'project',
        'projectName projectLocationGe projectLocationEn projectLocationRu',
      )
      .exec();
    if (!entry) {
      throw new NotFoundException(
        `Get-in-touch entry with id "${id}" not found`,
      );
    }
    return entry;
  }

  async update(
    id: string,
    updateGetInTouchDto: UpdateGetInTouchDto,
  ): Promise<GetInTouchDocument> {
    if (updateGetInTouchDto.project !== undefined) {
      await this.assertProjectExists(updateGetInTouchDto.project);
    }
    const entry = await this.getInTouchModel
      .findByIdAndUpdate(id, updateGetInTouchDto, {
        new: true,
        runValidators: true,
      })
      .exec();
    if (!entry) {
      throw new NotFoundException(
        `Get-in-touch entry with id "${id}" not found`,
      );
    }
    return entry;
  }

  async remove(id: string): Promise<void> {
    const entry = await this.getInTouchModel.findByIdAndDelete(id).exec();
    if (!entry) {
      throw new NotFoundException(
        `Get-in-touch entry with id "${id}" not found`,
      );
    }
  }

  private async assertProjectExists(projectId: string): Promise<void> {
    const exists = await this.projectsService.exists(projectId);
    if (!exists) {
      throw new BadRequestException(
        `Project with id "${projectId}" does not exist`,
      );
    }
  }
}
