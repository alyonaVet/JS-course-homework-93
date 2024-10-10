import {
  Body,
  Controller,
  Delete,
  Get, HttpException, HttpStatus,
  NotFoundException,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { Artist, ArtistDocument } from '../schemas/artist.schema';
import { InjectModel } from '@nestjs/mongoose';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateArtistDto } from './create-artist.dto';

@Controller('artists')
export class ArtistsController {
  constructor(@InjectModel(Artist.name) private artistModel: Model<ArtistDocument>) {
  }

  @Get()
  async getAllArtists() {
    return this.artistModel.find();
  }

  @Get(':id')
  async getOneArtist(@Param('id') id: string) {
    const artist = await this.artistModel.findOne({ _id: id });
    if (!artist) {
      throw new NotFoundException(`Artist with id ${id} not found`);
    }
    return artist;
  }

  @Post()
  @UseInterceptors(FileInterceptor('image', { dest: './public/images' }))
  async create(@Body() artistData: CreateArtistDto, @UploadedFile() file: Express.Multer.File) {
    return await this.artistModel.create({
      name: artistData.name,
      description: artistData.description,
      image: file ? 'images/' + file.filename : null,
    });
  }

  @Delete(':id')
  async deleteArtist(@Param('id') id: string) {
    try {
      const artist = await this.artistModel.findOne({ _id: id });
      if (!artist) {
        return ({error: `Artist with id ${id} not found`});
      }
      await this.artistModel.deleteOne({ _id: id });

      return { message: 'Artist was deleted successfully.'};

    } catch (error) {
      throw new HttpException(
        `Could not delete artist: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
