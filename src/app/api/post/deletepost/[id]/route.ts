import postModel from '@/models/postModel';
import { verifyToken } from '@/lib/jwt';
import { NextResponse } from 'next/server';
import DBConn from '@/lib/DBConn';

interface Iparams {
  id: string;
}

export const DELETE = async (req: Request, { params }: { params: Iparams }) => {
  const verifyUser = verifyToken(process.env.JWT_SECRET as string, req);

  if (!verifyUser) {
    return NextResponse.json(
      {
        state: 'error',
        message: 'Can not delete this post, log in first.',
      },
      {
        status: 401,
      },
    );
  }

  const { id } = params;

  console.log(id);

  if (!id || id === '') {
    return NextResponse.json(
      {
        state: 'error',
        message: 'No id found, can not delete post.',
      },
      {
        status: 400,
      },
    );
  }
  try {
    const userId = verifyUser.id;

    await DBConn();

    const postDocument = await postModel.findById({ _id: id });

    if (!postDocument) {
      return NextResponse.json(
        {
          state: 'error',
          message: 'No post found with this id.',
        },
        {
          status: 404,
        },
      );
    }

    if (postDocument.author.toString() !== userId) {
      return NextResponse.json(
        {
          state: 'error',
          message: 'Can not delete this post, you are not the author.',
        },
        {
          status: 409,
        },
      );
    }

    await postModel.deleteOne({ _id: postDocument._id });

    return NextResponse.json(
      {
        state: 'success',
        message: 'Your post has been deleted.',
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error('Failed in delete post', error);

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
