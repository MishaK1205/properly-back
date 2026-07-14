import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CompaniesService } from '../companies/companies.service';
import { ImagesService } from '../images/images.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project, ProjectDocument } from './schemas/project.schema';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    private readonly companiesService: CompaniesService,
    private readonly imagesService: ImagesService,
  ) {}

  async create(
    createProjectDto: CreateProjectDto,
  ): Promise<Record<string, unknown>> {
    await this.assertReferencesExist(createProjectDto);
    const project = await this.projectModel.create(createProjectDto);
    await project.populate('company');
    return this.toResponse(project);
  }

  async findAll(): Promise<Record<string, unknown>[]> {
    const projects = await this.projectModel
      .find()
      .sort({ createdAt: -1 })
      .populate('company')
      .exec();
    return projects.map((project) => this.toResponse(project));
  }

  async findOne(id: string): Promise<Record<string, unknown>> {
    const project = await this.projectModel
      .findById(id)
      .populate('company')
      .exec();
    if (!project) {
      throw new NotFoundException(`Project with id "${id}" not found`);
    }
    return this.toResponse(project);
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
  ): Promise<Record<string, unknown>> {
    await this.assertReferencesExist(updateProjectDto);
    const project = await this.projectModel
      .findByIdAndUpdate(id, updateProjectDto, {
        new: true,
        runValidators: true,
      })
      .populate('company')
      .exec();
    if (!project) {
      throw new NotFoundException(`Project with id "${id}" not found`);
    }
    return this.toResponse(project);
  }

  async remove(id: string): Promise<void> {
    const project = await this.projectModel.findByIdAndDelete(id).exec();
    if (!project) {
      throw new NotFoundException(`Project with id "${id}" not found`);
    }
  }

  async exists(id: string): Promise<boolean> {
    const found = await this.projectModel.exists({ _id: id }).exec();
    return found !== null;
  }

  /** Rejects payloads that reference a non-existent company or image ids. */
  private async assertReferencesExist(dto: UpdateProjectDto): Promise<void> {
    if (dto.company !== undefined) {
      const companyExists = await this.companiesService.exists(dto.company);
      if (!companyExists) {
        throw new BadRequestException(
          `Company with id "${dto.company}" does not exist`,
        );
      }
    }

    const imageIds = [
      ...(dto.projectImages ?? []),
      ...(dto.floorPlanImages ?? []),
    ];
    if (imageIds.length > 0) {
      const allImagesExist = await this.imagesService.allExist(imageIds);
      if (!allImagesExist) {
        throw new BadRequestException(
          'One or more referenced image ids do not exist — upload images first via POST /images',
        );
      }
    }
  }

  /** Renames the populated `company` field to `companyInfo` in API responses. */
  private toResponse(project: ProjectDocument): Record<string, unknown> {
    const { company, ...rest } = project.toObject({ versionKey: false });
    return { ...rest, companyInfo: company ?? null };
  }
}
