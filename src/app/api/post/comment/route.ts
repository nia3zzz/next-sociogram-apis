import DBConn from '@/lib/DBConn';
import { verifyToken } from '@/lib/jwt';
import { deleteComment, updateComment } from '@/middlewares/postZod';
import commentModel from '@/models/commentModel';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export const PUT = async (req: Request) => {
  const verifyUser = verifyToken(process.env.JWT_SECRET as string, req);

  if (!verifyUser) {
    return NextResponse.json(
      {
        state: 'error',
        message: 'Can not update your comment, login first.',
      },
      {
        status: 401,
      },
    );
  }

  const data = await req.json();

  if (!data) {
    return NextResponse.json(
      {
        state: 'error',
        message: 'Can not update to an empty comment.',
      },
      {
        status: 400,
      },
    );
  }

  try {
    const validateData = updateComment.parse(data);

    const userId = verifyUser.id;

    await DBConn();

    const commentDocument = await commentModel.findById(validateData.commentId);

    if (userId !== commentDocument.commentAuthor.toString()) {
      return NextResponse.json(
        {
          state: 'error',
          message: 'You can edit only your comment.',
        },
        {
          status: 409,
        },
      );
    }

    if (validateData.comment === commentDocument.content) {
      return NextResponse.json(
        {
          state: 'error',
          message: 'No changes found to update comment',
        },
        {
          status: 409,
        },
      );
    }

    await commentModel.findByIdAndUpdate(
      validateData.commentId,
      {
        $set: {
          content: validateData.comment,
        },
      },
      {
        new: true,
      },
    );

    return NextResponse.json(
      {
        state: 'success',
        message: 'Your comment has been updated.',
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          state: 'error',
          message: 'Failed in type validation.',
          errors: error.errors[0].message,
        },
        {
          status: 400,
        },
      );
    }

    console.error('Failed in comment post route: ', error);

    return NextResponse.json(
      {
        state: 'error',
        message: 'Something went wrong.',
      },
      {
        status: 500,
      },
    );
  }
};

export const DELETE = async (req: Request) => {
  const verifyUser = verifyToken(process.env.JWT_SECRET as string, req);

  if (!verifyUser) {
    return NextResponse.json(
      {
        state: 'error',
        message: 'Can not delete comment, login first',
      },
      {
        status: 401,
      },
    );
  }

  const data = await req.json();

  if (!data) {
    return NextResponse.json({
      state: 'error',
      message: 'No comment found to delete.',
    });
  }

  try {
    const validateData = deleteComment.parse(data);

    const userId = verifyUser.id;

    await DBConn();

    const commentDocument = await commentModel.findById(validateData.commentId);

    if (!commentDocument) {
      return NextResponse.json(
        {
          state: 'error',
          message: 'No comment found.',
        },
        {
          status: 404,
        },
      );
    }

    if (commentDocument.commentAuthor.toString() !== userId) {
      return NextResponse.json(
        {
          state: 'error',
          message: 'You can only delete your comment.',
        },
        {
          status: 409,
        },
      );
    }

    await commentModel.findByIdAndDelete(validateData.commentId);

    return NextResponse.json(
      {
        state: 'success',
        message: 'Comment has been deleted.',
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          state: 'error',
          message: 'Failed in type validation.',
          errors: error.errors[0].message,
        },
        {
          status: 400,
        },
      );
    }

    console.error('Failed in comment delete method: ', error);

    return NextResponse.json(
      {
        state: 'error',
        message: 'Something went wrong.',
      },
      {
        status: 500,
      },
    );
  }
};
