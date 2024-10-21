import mongoose, { Document, Schema } from 'mongoose';

interface IPost extends Document {
  author: mongoose.Types.ObjectId;
  caption: string;
  contentFiles: [string];
  reactLoves: [mongoose.Types.ObjectId];
  comments: [mongoose.Types.ObjectId];
}

const postSchema: Schema<IPost> = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, "Can't continue without author."],
    },

    caption: {
      type: String,
      required: false,
    },

    contentFiles: [
      {
        type: String,
        required: false,
      },
    ],

    reactLoves: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
      },
    ],

    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        required: false,
      },
    ],
  },
  { timestamps: true },
);

const postModel =
  mongoose.models.Post || mongoose.model<IPost>('Post', postSchema);
export default postModel;
