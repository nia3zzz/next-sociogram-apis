import mongoose, { Schema, Document } from 'mongoose';

interface IverifyMail extends Document {
  author: mongoose.Types.ObjectId;
  verifyHashedCode: string;
  createdAt: Date;
}

const verifyMailSchema: Schema<IverifyMail> = new mongoose.Schema({
  author: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, "Can't mail to a user with no user id."],
    },
  ],

  verifyHashedCode: {
    type: String,
    required: [true, "Can't mail to a user with no verification code."],
  },

  createdAt: {
    type: Date,
    default: Date.now,
    expires: 1800,
  },
});

const verifyMailModel =
  mongoose.models.verifyMail ||
  mongoose.model<IverifyMail>('verifyMail', verifyMailSchema);

export default verifyMailModel;
