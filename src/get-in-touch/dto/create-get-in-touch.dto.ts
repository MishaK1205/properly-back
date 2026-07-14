import { IsMongoId, IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateGetInTouchDto {
  /** Id of the project the user is interested in. */
  @IsMongoId()
  project: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  /** Digits with optional "+" prefix, e.g. +995555123456. */
  @IsString()
  @Matches(/^\+?\d{6,15}$/, {
    message:
      'whatsAppNumber must contain 6-15 digits, optionally prefixed with "+"',
  })
  whatsAppNumber: string;

  @IsString()
  @IsNotEmpty()
  budgetRange: string;

  @IsString()
  @IsNotEmpty()
  investmentPurpose: string;
}
