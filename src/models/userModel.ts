import mongoose, { Schema, Document } from 'mongoose';

interface IUser extends Document {
  name: string;
  userName: string;
  email: string;
  telePhone?: string;
  gender: 'male' | 'female';
  profilePic?: string;
  bio?: string;
  following: [mongoose.Types.ObjectId];
  followers: [mongoose.Types.ObjectId];
  password: string;
}

const UserSchema: Schema<IUser> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Can't continue without a name."],
    },
    userName: {
      type: String,
      required: [true, "Can't continue without an username."],
      unique: true,
    },
    email: {
      type: String,
      required: [true, "Can't continue without an email."],
      unique: true,
    },

    telePhone: {
      type: String,
      required: false,
      unique: false,
    },

    gender: {
      type: String,
      enum: ['male', 'female'],
      required: [true, "Can't continue without providing a gender."],
    },

    profilePic: {
      type: String,
      default:
        'https://uxwing.com/wp-content/themes/uxwing/download/peoples-avatars/man-user-circle-icon.png',
    },

    bio: {
      type: String,
      required: false,
    },

    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    password: {
      type: String,
      required: [true, "Can't continue without a password."],
    },
  },
  { timestamps: true },
);

const userModel =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default userModel;
