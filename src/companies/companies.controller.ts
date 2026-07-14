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
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@ApiTags('companies')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @ApiBearerAuth('access-token')
  create(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companiesService.create(createCompanyDto);
  }

  @Public()
  @Get()
  findAll() {
    return this.companiesService.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ObjectIdPipe) id: string) {
    return this.companiesService.findOne(id);
  }

  @Put(':id')
  @ApiBearerAuth('access-token')
  update(
    @Param('id', ObjectIdPipe) id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    return this.companiesService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  remove(@Param('id', ObjectIdPipe) id: string) {
    return this.companiesService.remove(id);
  }
}
