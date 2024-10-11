import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Album } from './album.schema';
import mongoose, { Document } from 'mongoose';

export type TrackDocument = Track & Document;

@Schema()
export class Track {
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Album',
  })
  album: Album;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  trackNumber: number;

  @Prop({ required: true, default: false })
  isPublished: boolean;

  @Prop()
  duration: string;
}

export const TrackSchema = SchemaFactory.createForClass(Track);