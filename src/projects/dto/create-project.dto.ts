import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
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

  @IsString()
  @IsNotEmpty()
  projectLocationGe: string;

  @IsString()
  @IsNotEmpty()
  projectLocationEn: string;

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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectDescriptionCardDto)
  projectDescriptionCards: ProjectDescriptionCardDto[];

  @IsArray()
  @IsString({ each: true })
  projectAdvantagesGe: string[];

  @IsArray()
  @IsString({ each: true })
  projectAdvantagesEn: string[];

  @IsArray()
  @IsString({ each: true })
  projectAdvantagesRu: string[];

  @IsString()
  @IsNotEmpty()
  paymentDescriptionGe: string;

  @IsString()
  @IsNotEmpty()
  paymentDescriptionEn: string;

  @IsString()
  @IsNotEmpty()
  paymentDescriptionRu: string;

  @ValidateNested()
  @Type(() => ProjectDescriptionDto)
  projectDescription: ProjectDescriptionDto;

  @IsArray()
  @IsString({ each: true })
  verificationChecklistGe: string[];

  @IsArray()
  @IsString({ each: true })
  verificationChecklistEn: string[];

  @IsArray()
  @IsString({ each: true })
  verificationChecklistRu: string[];

  @IsDateString()
  lastVerified: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvestmentCardDto)
  investmentCards: InvestmentCardDto[];

  @IsString()
  @IsNotEmpty()
  buildingTypeGe: string;

  @IsString()
  @IsNotEmpty()
  buildingTypeEn: string;

  @IsString()
  @IsNotEmpty()
  buildingTypeRu: string;

  @IsNumber()
  @Min(0)
  totalFloors: number;

  @IsNumber()
  @Min(0)
  unitsInBuilding: number;

  @IsString()
  @IsNotEmpty()
  unitSizesAvailable: string;

  @IsString()
  @IsNotEmpty()
  finishingGe: string;

  @IsString()
  @IsNotEmpty()
  finishingEn: string;

  @IsString()
  @IsNotEmpty()
  finishingRu: string;

  @IsString()
  @IsNotEmpty()
  furniturePackageGe: string;

  @IsString()
  @IsNotEmpty()
  furniturePackageEn: string;

  @IsString()
  @IsNotEmpty()
  furniturePackageRu: string;

  @IsString()
  @IsNotEmpty()
  strManagementOnSiteGe: string;

  @IsString()
  @IsNotEmpty()
  strManagementOnSiteEn: string;

  @IsString()
  @IsNotEmpty()
  strManagementOnSiteRu: string;

  @IsString()
  @IsNotEmpty()
  distanceToSea: string;

  @IsString()
  @IsNotEmpty()
  distanceToCityCenter: string;

  /** Ids of previously uploaded images (POST /images). */
  @IsArray()
  @IsMongoId({ each: true })
  floorPlanImages: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PricingBySquareMeterDto)
  pricingBySquareMeters: PricingBySquareMeterDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentPlanDto)
  paymentPlans: PaymentPlanDto[];

  @IsArray()
  @IsString({ each: true })
  paymentAdvantagesGe: string[];

  @IsArray()
  @IsString({ each: true })
  paymentAdvantagesEn: string[];

  @IsArray()
  @IsString({ each: true })
  paymentAdvantagesRu: string[];

  /** Id of the company this project is assigned to. */
  @IsMongoId()
  company: string;
}
