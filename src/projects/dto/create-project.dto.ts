import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class ProjectDescriptionCardDto {
  @IsString()
  @IsNotEmpty()
  projectDescriptionCardTitleGe: string;

  @IsString()
  @IsNotEmpty()
  projectDescriptionCardTitleEn: string;

  @IsString()
  @IsNotEmpty()
  projectDescriptionCardTitleRu: string;

  @IsString()
  @IsNotEmpty()
  projectDescriptionCardContentGe: string;

  @IsString()
  @IsNotEmpty()
  projectDescriptionCardContentEn: string;

  @IsString()
  @IsNotEmpty()
  projectDescriptionCardContentRu: string;

  @IsString()
  @IsNotEmpty()
  projectDescriptionCardDescriptionGe: string;

  @IsString()
  @IsNotEmpty()
  projectDescriptionCardDescriptionEn: string;

  @IsString()
  @IsNotEmpty()
  projectDescriptionCardDescriptionRu: string;
}

export class ProjectDescriptionDto {
  @IsString()
  @IsNotEmpty()
  projectDescriptionTitleGe: string;

  @IsString()
  @IsNotEmpty()
  projectDescriptionTitleEn: string;

  @IsString()
  @IsNotEmpty()
  projectDescriptionTitleRu: string;

  @IsString()
  @IsNotEmpty()
  projectDescriptionContentGe: string;

  @IsString()
  @IsNotEmpty()
  projectDescriptionContentEn: string;

  @IsString()
  @IsNotEmpty()
  projectDescriptionContentRu: string;

  @IsString()
  @IsNotEmpty()
  projectShortDescriptionGe: string;

  @IsString()
  @IsNotEmpty()
  projectShortDescriptionEn: string;

  @IsString()
  @IsNotEmpty()
  projectShortDescriptionRu: string;
}

export class InvestmentCardDto {
  @IsString()
  @IsNotEmpty()
  investmentCardTitleGe: string;

  @IsString()
  @IsNotEmpty()
  investmentCardTitleEn: string;

  @IsString()
  @IsNotEmpty()
  investmentCardTitleRu: string;

  @IsString()
  @IsNotEmpty()
  investmentCardContentGe: string;

  @IsString()
  @IsNotEmpty()
  investmentCardContentEn: string;

  @IsString()
  @IsNotEmpty()
  investmentCardContentRu: string;

  @IsString()
  @IsNotEmpty()
  investmentCardDescriptionGe: string;

  @IsString()
  @IsNotEmpty()
  investmentCardDescriptionEn: string;

  @IsString()
  @IsNotEmpty()
  investmentCardDescriptionRu: string;
}

export class PricingBySquareMeterDto {
  @IsString()
  @IsNotEmpty()
  squareMeterRange: string;

  @IsNumber()
  @Min(0)
  startingPrice: number;
}

export class PaymentPlanDto {
  @IsString()
  @IsNotEmpty()
  paymentStageGe: string;

  @IsString()
  @IsNotEmpty()
  paymentStageEn: string;

  @IsString()
  @IsNotEmpty()
  paymentStageRu: string;

  @IsNumber()
  @Min(0)
  paymentAmount: number;

  @IsString()
  @IsNotEmpty()
  whenGe: string;

  @IsString()
  @IsNotEmpty()
  whenEn: string;

  @IsString()
  @IsNotEmpty()
  whenRu: string;
}

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  projectName: string;

  /** Ids of previously uploaded images (POST /images). */
  @IsArray()
  @IsMongoId({ each: true })
  projectImages: string[];

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  projectLocationGe: string;

  @IsString()
  @IsNotEmpty()
  projectLocationEn: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  projectLocationRu: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  projectLatitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  projectLongitude: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectDescriptionCardDto)
  projectDescriptionCards: ProjectDescriptionCardDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  projectAdvantagesGe: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  projectAdvantagesEn: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  projectAdvantagesRu: string[];

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  paymentDescriptionGe: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  paymentDescriptionEn: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  paymentDescriptionRu: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProjectDescriptionDto)
  projectDescription: ProjectDescriptionDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  verificationChecklistGe: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  verificationChecklistEn: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  verificationChecklistRu: string[];

  @IsOptional()
  @IsDateString()
  lastVerified: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvestmentCardDto)
  investmentCards: InvestmentCardDto[];

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  buildingTypeGe: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  buildingTypeEn: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  buildingTypeRu: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalFloors: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitsInBuilding: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  unitSizesAvailable: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  finishingGe: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  finishingEn: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  finishingRu: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  furniturePackageGe: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  furniturePackageEn: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  furniturePackageRu: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  strManagementOnSiteGe: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  strManagementOnSiteEn: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  strManagementOnSiteRu: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  distanceToSea: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  distanceToCityCenter: string;

  /** Ids of previously uploaded images (POST /images). */
  @IsArray()
  @IsMongoId({ each: true })
  floorPlanImages: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PricingBySquareMeterDto)
  pricingBySquareMeters: PricingBySquareMeterDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentPlanDto)
  paymentPlans: PaymentPlanDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  paymentAdvantagesGe: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  paymentAdvantagesEn: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  paymentAdvantagesRu: string[];

  /** Id of the company this project is assigned to. */
  @IsMongoId()
  company: string;
}
