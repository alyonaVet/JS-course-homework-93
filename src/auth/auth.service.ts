import { Injectable } from '@nestjs/common';
import { User, UserDocument } from '../schemas/user.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class AuthService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {
  }

  async validateUser(username: string, password: string) {
    const user = await this.userModel.findOne({ username });

    if (!user) {
      return null;
    }

    const isPasswordCorrect = await user.checkPassword(password);

    if (!isPasswordCorrect) {
      return null;
    }

    return user;
  }
}
