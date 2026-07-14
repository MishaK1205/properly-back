import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Project } from '../../projects/schemas/project.schema';

export type GetInTouchDocument = HydratedDocument<GetInTouch>;

@Schema({ timestamps: true })
export class GetInTouch {
  /** The project the user is interested in. */
  @Prop({ type: Types.ObjectId, ref: Project.name, required: true })
  project: Types.ObjectId;

  @Prop({ required: true, trim: true })
  fullName: string;

  /**
   * Stored as a string (not a number) so leading zeros and the "+" country
   * prefix are preserved — phone numbers are identifiers, not quantities.
   */
  @Prop({ required: true, trim: true })
  whatsAppNumber: string;

  @Prop({ required: true, trim: true })
  budgetRange: string;

  @Prop({ required: true, trim: true })
  investmentPurpose: string;
}

export const GetInTouchSchema = SchemaFactory.createForClass(GetInTouch);
