import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { randomUUID } from 'crypto';
import { compare, genSalt, hash } from 'bcrypt';
import { Role } from '../users/role.enum';

const SALT_WORK_FACTOR = 10;


export interface UserMethods {
  generateToken: () => void;
  checkPassword: (password: string) => Promise<boolean>;
}

export type UserDocument = User & Document & UserMethods;

@Schema()
export class User {

  @Prop({
    required: true,
    unique: true,
  })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  token: string;

  @Prop({ required: true })
  displayName: string;

  @Prop({
    type: String,
    required: true,
    enum: Role,
    default: Role.User,
  })
  role: Role;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.methods.generateToken = function() {
  this.token = randomUUID();
};

UserSchema.methods.checkPassword = function(password: string) {
  return compare(password, this.password);
};

UserSchema.pre<UserDocument>('save', async function() {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await genSalt(SALT_WORK_FACTOR);
  this.password = await hash(this.password, salt);
});

UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  }
});