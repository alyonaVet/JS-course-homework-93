import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Track, TrackDocument } from '../schemas/track.schema';
import { Model } from 'mongoose';
import { CreateTrackDto } from './create-track.dto';
import { TokenAuthGuard } from '../auth/token-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../users/roles.decorator';
import { Role } from '../users/role.enum';

@Controller('tracks')
export class TracksController {
  constructor(@InjectModel(Track.name) private trackModel: Model<TrackDocument>) {
  }

  @Get()
  async getAllTracks(@Query('album') album?: string) {
    try {
      const filter = album ? { album: album } : {};
      return await this.trackModel.find(filter).sort({ trackNumber: 1 });
    } catch (error) {
      if (error.name === 'CastError') {
        throw new HttpException(`${error.message}`, HttpStatus.BAD_REQUEST);
      }
      throw new HttpException(`${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  async getOneTrack(@Param('id') id: string) {
    try {
      const track = await this.trackModel.findOne({ _id: id }).populate('album', 'title');
      if (!track) {
        return new NotFoundException(`Track with id ${id} not found`);
      }
      return track;
    } catch (error) {
      throw new BadRequestException(`Invalid ObjectId: ${id}`);
    }
  }

  @UseGuards(TokenAuthGuard)
  @Post()
  async createTrack(@Body() trackData: CreateTrackDto) {
    try {
      return await this.trackModel.create({
        album: trackData.album,
        title: trackData.title,
        trackNumber: trackData.trackNumber,
        duration: trackData.duration,
      })
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw new HttpException(`${error.message}`, HttpStatus.BAD_REQUEST);
      }
      throw new HttpException(`Error creating track: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(TokenAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Delete(':id')
  async deleteTrack(@Param('id') id: string) {
    try {
      const track = await this.trackModel.findOne({ _id: id });
      if (!track) {
        return ({ error: `Track with id ${id} not found` });
      }
      await this.trackModel.deleteOne({ _id: id });

      return { message: 'Track was deleted successfully.' };

    } catch (error) {
      if (error.name === 'CastError') {
        throw new HttpException(`${error.message}`, HttpStatus.BAD_REQUEST);
      }
      throw new HttpException(`Error deleting track: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
