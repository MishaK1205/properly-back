import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Company } from '../../companies/schemas/company.schema';
import { Image } from '../../images/schemas/image.schema';

@Schema({ _id: false })
export class ProjectDescriptionCard {
  @Prop({ required: true })
  projectDescriptionCardTitleGe: string;

  @Prop({ required: true })
  projectDescriptionCardTitleEn: string;

  @Prop({ required: true })
  projectDescriptionCardTitleRu: string;

  @Prop({ required: true })
  projectDescriptionCardContentGe: string;

  @Prop({ required: true })
  projectDescriptionCardContentEn: string;

  @Prop({ required: true })
  projectDescriptionCardContentRu: string;

  @Prop({ required: true })
  projectDescriptionCardDescriptionGe: string;

  @Prop({ required: true })
  projectDescriptionCardDescriptionEn: string;

  @Prop({ required: true })
  projectDescriptionCardDescriptionRu: string;
}

export const ProjectDescriptionCardSchema = SchemaFactory.createForClass(
  ProjectDescriptionCard,
);

@Schema({ _id: false })
export class ProjectDescription {
  @Prop({ required: true })
  projectDescriptionTitleGe: string;

  @Prop({ required: true })
  projectDescriptionTitleEn: string;

  @Prop({ required: true })
  projectDescriptionTitleRu: string;

  @Prop({ required: true })
  projectDescriptionContentGe: string;

  @Prop({ required: true })
  projectDescriptionContentEn: string;

  @Prop({ required: true })
  projectDescriptionContentRu: string;

  @Prop({ required: true })
  projectShortDescriptionGe: string;

  @Prop({ required: true })
  projectShortDescriptionEn: string;

  @Prop({ required: true })
  projectShortDescriptionRu: string;
}

export const ProjectDescriptionSchema =
  SchemaFactory.createForClass(ProjectDescription);

@Schema({ _id: false })
export class InvestmentCard {
  @Prop({ required: true })
  investmentCardTitleGe: string;

  @Prop({ required: true })
  investmentCardTitleEn: string;

  @Prop({ required: true })
  investmentCardTitleRu: string;

  @Prop({ required: true })
  investmentCardContentGe: string;

  @Prop({ required: true })
  investmentCardContentEn: string;

  @Prop({ required: true })
  investmentCardContentRu: string;

  @Prop({ required: true })
  investmentCardDescriptionGe: string;

  @Prop({ required: true })
  investmentCardDescriptionEn: string;

  @Prop({ required: true })
  investmentCardDescriptionRu: string;
}

export const InvestmentCardSchema =
  SchemaFactory.createForClass(InvestmentCard);

@Schema({ _id: false })
export class PricingBySquareMeter {
  @Prop({ required: true })
  squareMeterRange: string;

  @Prop({ required: true, min: 0 })
  startingPrice: number;
}

export const PricingBySquareMeterSchema =
  SchemaFactory.createForClass(PricingBySquareMeter);

@Schema({ _id: false })
export class PaymentPlan {
  @Prop({ required: true })
  paymentStageGe: string;

  @Prop({ required: true })
  paymentStageEn: string;

  @Prop({ required: true })
  paymentStageRu: string;

  @Prop({ required: true, min: 0 })
  paymentAmount: number;

  @Prop({ required: true })
  whenGe: string;

  @Prop({ required: true })
  whenEn: string;

  @Prop({ required: true })
  whenRu: string;
}

export const PaymentPlanSchema = SchemaFactory.createForClass(PaymentPlan);

export type ProjectDocument = HydratedDocument<Project>;

@Schema({ timestamps: true })
export class Project {
  @Prop({ required: true, trim: true })
  projectName: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: Image.name }], default: [] })
  projectImages: Types.ObjectId[];

  @Prop({ trim: true })
  projectLocationGe: string;

  @Prop({ required: true, trim: true })
  projectLocationEn: string;

  @Prop({ trim: true })
  projectLocationRu: string;

  @Prop({ required: true })
  projectLatitude: number;

  @Prop({ required: true })
  projectLongitude: number;

  @Prop({ type: [ProjectDescriptionCardSchema], default: [] })
  projectDescriptionCards: ProjectDescriptionCard[];

  @Prop({ type: [String], default: [] })
  projectAdvantagesGe: string[];

  @Prop({ type: [String], default: [] })
  projectAdvantagesEn: string[];

  @Prop({ type: [String], default: [] })
  projectAdvantagesRu: string[];

  @Prop()
  paymentDescriptionGe: string;

  @Prop()
  paymentDescriptionEn: string;

  @Prop()
  paymentDescriptionRu: string;

  @Prop({ type: ProjectDescriptionSchema })
  projectDescription: ProjectDescription;

  @Prop({ type: [String], default: [] })
  verificationChecklistGe: string[];

  @Prop({ type: [String], default: [] })
  verificationChecklistEn: string[];

  @Prop({ type: [String], default: [] })
  verificationChecklistRu: string[];

  @Prop()
  lastVerified: Date;

  @Prop({ type: [InvestmentCardSchema], default: [] })
  investmentCards: InvestmentCard[];

  @Prop()
  buildingTypeGe: string;

  @Prop()
  buildingTypeEn: string;

  @Prop()
  buildingTypeRu: string;

  @Prop({ min: 0 })
  totalFloors: number;

  @Prop({ min: 0 })
  unitsInBuilding: number;

  @Prop()
  unitSizesAvailable: string;

  @Prop()
  finishingGe: string;

  @Prop()
  finishingEn: string;

  @Prop()
  finishingRu: string;

  @Prop()
  furniturePackageGe: string;

  @Prop()
  furniturePackageEn: string;

  @Prop()
  furniturePackageRu: string;

  @Prop()
  strManagementOnSiteGe: string;

  @Prop()
  strManagementOnSiteEn: string;

  @Prop()
  strManagementOnSiteRu: string;

  @Prop()
  distanceToSea: string;

  @Prop()
  distanceToCityCenter: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: Image.name }], default: [] })
  floorPlanImages: Types.ObjectId[];

  @Prop({ type: [PricingBySquareMeterSchema], default: [] })
  pricingBySquareMeters: PricingBySquareMeter[];

  @Prop({ type: [PaymentPlanSchema], default: [] })
  paymentPlans: PaymentPlan[];

  @Prop({ type: [String], default: [] })
  paymentAdvantagesGe: string[];

  @Prop({ type: [String], default: [] })
  paymentAdvantagesEn: string[];

  @Prop({ type: [String], default: [] })
  paymentAdvantagesRu: string[];

  /** The company this project belongs to. Exposed as `companyInfo` in responses. */
  @Prop({ type: Types.ObjectId, ref: Company.name, required: true })
  company: Types.ObjectId;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
