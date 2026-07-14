import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { ObjectIdPipe } from '../common/pipes/object-id.pipe';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiBearerAuth('access-token')
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  @Public()
  @Get()
  findAll() {
    return this.projectsService.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ObjectIdPipe) id: string) {
    return this.projectsService.findOne(id);
  }

  @Put(':id')
  @ApiBearerAuth('access-token')
  update(
    @Param('id', ObjectIdPipe) id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  remove(@Param('id', ObjectIdPipe) id: string) {
    return this.projectsService.remove(id);
  }
}
