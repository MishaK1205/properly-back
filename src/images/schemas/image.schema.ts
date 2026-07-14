import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ImageDocument = HydratedDocument<Image>;

@Schema({ timestamps: true })
export class Image {
  /** Original file name as uploaded by the client (informational only). */
  @Prop({ required: true })
  originalName: string;

  /** Generated UUID file name under UPLOAD_DIR — never client-controlled. */
  @Prop({ required: true, unique: true })
  filename: string;

  @Prop({ required: true })
  mimeType: string;

  /** Size in bytes. */
  @Prop({ required: true })
  size: number;
}

export const ImageSchema = SchemaFactory.createForClass(Image);
