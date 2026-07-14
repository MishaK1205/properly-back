import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CompanyDocument = HydratedDocument<Company>;

@Schema({ timestamps: true })
export class Company {
  @Prop({ required: true, trim: true })
  companyName: string;

  @Prop({ required: true, min: 0 })
  projectsCompleted: number;

  @Prop({ required: true, min: 0 })
  unitsDelivered: number;

  @Prop({ required: true, min: 0 })
  activeProjects: number;

  @Prop({ required: true })
  operatingSince: number;

  @Prop({ required: true, trim: true })
  companyLocationGe: string;

  @Prop({ required: true, trim: true })
  companyLocationEn: string;

  @Prop({ required: true, trim: true })
  companyLocationRu: string;

  @Prop({ required: true })
  companyDescriptionGe: string;

  @Prop({ required: true })
  companyDescriptionEn: string;

  @Prop({ required: true })
  companyDescriptionRu: string;
}

export const CompanySchema = SchemaFactory.createForClass(Company);
