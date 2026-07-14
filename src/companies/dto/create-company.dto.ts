import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsNumber()
  @Min(0)
  projectsCompleted: number;

  @IsNumber()
  @Min(0)
  unitsDelivered: number;

  @IsNumber()
  @Min(0)
  activeProjects: number;

  @IsInt()
  @Min(1800)
  @Max(2100)
  operatingSince: number;

  @IsString()
  @IsNotEmpty()
  companyLocationGe: string;

  @IsString()
  @IsNotEmpty()
  companyLocationEn: string;

  @IsString()
  @IsNotEmpty()
  companyLocationRu: string;

  @IsString()
  @IsNotEmpty()
  companyDescriptionGe: string;

  @IsString()
  @IsNotEmpty()
  companyDescriptionEn: string;

  @IsString()
  @IsNotEmpty()
  companyDescriptionRu: string;
}
