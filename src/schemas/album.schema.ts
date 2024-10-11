import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Artist } from './artist.schema';
import mongoose, { Document } from 'mongoose';

export type AlbumDocument = Album & Document;

@Schema()
export class Album {
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artist',
  })
  artist: Artist;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  date: number;

  @Prop({ required: true, default: false })
  isPublished: boolean;

  @Prop()
  image: string;
}

export const AlbumSchema = SchemaFactory.createForClass(Album);