import { PartialType } from '@nestjs/mapped-types';
import { CreateGetInTouchDto } from './create-get-in-touch.dto';

export class UpdateGetInTouchDto extends PartialType(CreateGetInTouchDto) {}
