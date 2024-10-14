import { Body, Controller, Post } from '@nestjs/common';
import { User, UserDocument } from '../schemas/user.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateUserDto } from './create-user.dto';

@Controller('users')
export class UsersController {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {
  }

  @Post()
  async registerUser(@Body() userData: CreateUserDto) {
    const user = new this.userModel({
      username: userData.username,
      password: userData.password,
      displayName: userData.displayName,
    });

    user.generateToken();

    return await user.save();
  }
}