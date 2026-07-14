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
import { CreateGetInTouchDto } from './dto/create-get-in-touch.dto';
import { UpdateGetInTouchDto } from './dto/update-get-in-touch.dto';
import { GetInTouchService } from './get-in-touch.service';

@ApiTags('get-in-touch')
@Controller('get-in-touch')
export class GetInTouchController {
  constructor(private readonly getInTouchService: GetInTouchService) {}

  /**
   * Public: this is the lead form that website visitors submit —
   * requiring auth here would make the form unusable.
   */
  @Public()
  @Post()
  create(@Body() createGetInTouchDto: CreateGetInTouchDto) {
    return this.getInTouchService.create(createGetInTouchDto);
  }

  @Get()
  @ApiBearerAuth('access-token')
  findAll() {
    return this.getInTouchService.findAll();
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  findOne(@Param('id', ObjectIdPipe) id: string) {
    return this.getInTouchService.findOne(id);
  }

  @Put(':id')
  @ApiBearerAuth('access-token')
  update(
    @Param('id', ObjectIdPipe) id: string,
    @Body() updateGetInTouchDto: UpdateGetInTouchDto,
  ) {
    return this.getInTouchService.update(id, updateGetInTouchDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  remove(@Param('id', ObjectIdPipe) id: string) {
    return this.getInTouchService.remove(id);
  }
}
