import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectsModule } from '../projects/projects.module';
import { GetInTouchController } from './get-in-touch.controller';
import { GetInTouchService } from './get-in-touch.service';
import { GetInTouch, GetInTouchSchema } from './schemas/get-in-touch.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GetInTouch.name, schema: GetInTouchSchema },
    ]),
    ProjectsModule,
  ],
  controllers: [GetInTouchController],
  providers: [GetInTouchService],
})
export class GetInTouchModule {}
