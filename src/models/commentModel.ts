import mongoose, { Schema, Document } from 'mongoose';

interface IComment extends Document {
  postCommentedOn: mongoose.Types.ObjectId;
  commentAuthor: mongoose.Types.ObjectId;
  content: string;
}

const commentSchema: Schema<IComment> = new mongoose.Schema(
  {
    postCommentedOn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: [true, "Can't continue without Post."],
    },

    commentAuthor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, "Can't continue without User."],
    },

    content: {
      type: String,
      required: [true, "Can't continue without content."],
    },
  },
  { timestamps: true },
);

const commentModel =
  mongoose.models.Comment || mongoose.model<IComment>('Comment', commentSchema);
export default commentModel;
