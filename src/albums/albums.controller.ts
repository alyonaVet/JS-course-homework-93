import {
  BadRequestException,
  Body,
  Controller, Delete,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query, UploadedFile, UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Album, AlbumDocument } from '../schemas/album.schema';
import { Model } from 'mongoose';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateAlbumDto } from './create-album.dto';
import { Track, TrackDocument } from '../schemas/track.schema';
import { TokenAuthGuard } from '../auth/token-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../users/roles.decorator';
import { Role } from '../users/role.enum';

@Controller('albums')
export class AlbumsController {
  constructor(
    @InjectModel(Album.name) private albumModel: Model<AlbumDocument>,
    @InjectModel(Track.name) private trackModel: Model<TrackDocument>,
  ) {
  }

  @Get()
  async getAllAlbums(@Query('artist') artist?: string) {
    try {
      const filter = artist ? { artist: artist } : {};
      return await this.albumModel.find(filter);
    } catch (error) {
      if (error.name === 'CastError') {
        throw new HttpException(`${error.message}`, HttpStatus.BAD_REQUEST);
      }
      throw new HttpException(`${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  async getOneAlbum(@Param('id') id: string) {
    try {
      const album = await this.albumModel.findOne({ _id: id }).populate('artist', 'name');
      if (!album) {
        return new NotFoundException(`Album with id ${id} not found`);
      }
      return album;
    } catch (error) {
      throw new BadRequestException(`Invalid ObjectId: ${id}`);
    }
  }

  @UseGuards(TokenAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('image', { dest: './public/images' }))
  async createAlbum(@Body() albumData: CreateAlbumDto, @UploadedFile() file: Express.Multer.File) {
    try {
      return await this.albumModel.create({
        artist: albumData.artist,
        title: albumData.title,
        date: albumData.date,
        image: file ? 'images/' + file.filename : null,
      });
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw new HttpException(`${error.message}`, HttpStatus.BAD_REQUEST);
      }
      throw new HttpException(`Error creating album: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(TokenAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Delete(':id')
  async deleteAlbum(@Param('id') id: string) {
    try {
      const album = await this.albumModel.findOne({ _id: id });
      if (!album) {
        return new NotFoundException(`Album with id ${id} not found`);
      }
      await this.trackModel.deleteMany({ album: id });

      await this.albumModel.deleteOne({ _id: id });

      return { message: 'Album was deleted successfully.' };

    } catch (error) {
      if (error.name === 'CastError') {
        throw new HttpException(`${error.message}`, HttpStatus.BAD_REQUEST);
      }
      throw new HttpException(`Error deleting album: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
