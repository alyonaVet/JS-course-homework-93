import {
  Body,
  Controller, Delete,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query, UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Album, AlbumDocument } from '../schemas/album.schema';
import { Model } from 'mongoose';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateAlbumDto } from './create-album.dto';

@Controller('albums')
export class AlbumsController {
  constructor(@InjectModel(Album.name) private albumModel: Model<AlbumDocument>) {
  }

  @Get()
  async getAllAlbums(@Query('artist') artist?: string) {
    const filter = artist ? { artist: artist } : {};
    return this.albumModel.find(filter);
  }

  @Get(':id')
  async getOneAlbum(@Param('id') id: string) {
    try {
      const album = await this.albumModel.findOne({ _id: id }).populate('artist', 'name');
      if (!album) {
        throw new NotFoundException(`Album with id ${id} not found`);
      }
      return album;
    } catch (error) {
      throw new HttpException(`${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

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

  @Delete(':id')
  async deleteAlbum(@Param('id') id: string) {
    try {
      const album = await this.albumModel.findOne({ _id: id });
      if (!album) {
        return ({ error: `Album with id ${id} not found` });
      }
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
