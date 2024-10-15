import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get, HttpException, HttpStatus,
  NotFoundException,
  Param,
  Post,
  UploadedFile, UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { Artist, ArtistDocument } from '../schemas/artist.schema';
import { InjectModel } from '@nestjs/mongoose';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateArtistDto } from './create-artist.dto';
import { Album, AlbumDocument } from '../schemas/album.schema';
import { TokenAuthGuard } from '../auth/token-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../users/roles.decorator';
import { Role } from '../users/role.enum';

@Controller('artists')
export class ArtistsController {
  constructor(
    @InjectModel(Artist.name) private artistModel: Model<ArtistDocument>,
    @InjectModel(Album.name) private albumModel: Model<AlbumDocument>,
  ) {
  }

  @Get()
  async getAllArtists() {
    return this.artistModel.find();
  }

  @Get(':id')
  async getOneArtist(@Param('id') id: string) {
    try {
      const artist = await this.artistModel.findOne({ _id: id });
      if (!artist) {
        return new NotFoundException(`Artist with id ${id} not found`);
      }
      return artist;
    } catch (error) {
      throw new BadRequestException(`Invalid ObjectId: ${id}`);
    }

  }

  @UseGuards(TokenAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('image', { dest: './public/images' }))
  async createArtist(@Body() artistData: CreateArtistDto, @UploadedFile() file: Express.Multer.File) {
    try {
      return await this.artistModel.create({
        name: artistData.name,
        description: artistData.description,
        image: file ? 'images/' + file.filename : null,
      });
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw new HttpException(`${error.message}`, HttpStatus.BAD_REQUEST);
      }
      throw new HttpException(`Error creating artist: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }

  }

  @UseGuards(TokenAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Delete(':id')
  async deleteArtist(@Param('id') id: string) {
    try {
      const artist = await this.artistModel.findOne({ _id: id });
      if (!artist) {
        return new NotFoundException(`Artist with id ${id} not found`);
      }
      await this.albumModel.deleteMany({ artist: id });

      await this.artistModel.deleteOne({ _id: id });

      return { message: 'Artist was deleted successfully.' };

    } catch (error) {
      if (error.name === 'CastError') {
        throw new HttpException(`${error.message}`, HttpStatus.BAD_REQUEST);
      }
      throw new HttpException(`Error deleting artist: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
