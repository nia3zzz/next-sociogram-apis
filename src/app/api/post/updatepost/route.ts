import { NextResponse } from 'next/server';
import postModel from '@/models/postModel';
import { verifyToken } from '@/lib/jwt';
import { ZodError } from 'zod';
import { updatePost } from '@/middlewares/postZod';
import DBConn from '@/lib/DBConn';

export const PUT = async (req: Request) => {
  const verifyUser = verifyToken(process.env.JWT_SECRET as string, req);

  if (!verifyUser) {
    return NextResponse.json(
      {
        state: 'error',
        message: 'Can not update post, login first.',
      },
      {
        status: 401,
      },
    );
  }

  const data = await req.formData();

  if (!data) {
    return NextResponse.json({
      state: 'error',
      message: 'Can not continue without any data.',
    });
  }

  const postId = data.get('postId');
  const caption = data.get('caption');

  try {
    const validateData = updatePost.parse({ postId, caption });

    const userId = verifyUser.id;

    await DBConn();

    const postDocument = await postModel.findById(validateData.postId);

    if (postDocument.author.toString() !== userId) {
      return NextResponse.json(
        {
          state: 'error',
          message: 'You can not update this post.',
        },
        {
          status: 412,
        },
      );
    }

    const updatePostDocument = await postModel.findByIdAndUpdate(
      postDocument._id,
      {
        $set: {
          caption: validateData.caption,
        },
      },
      {
        new: true,
      },
    );

    return NextResponse.json(
      {
        state: 'success',
        message: 'Your post has been updated.',
        data: updatePostDocument,
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

    console.error('Failed in Update post: ', error);

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
