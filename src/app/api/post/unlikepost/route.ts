import userModel from '@/models/userModel';
import postModel from '@/models/postModel';
import { reactPost } from '@/middlewares/postZod';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { ZodError } from 'zod';
import DBConn from '@/lib/DBConn';

export const PUT = async (req: Request) => {
  const verifyUser = verifyToken(process.env.JWT_SECRET as string, req);

  if (!verifyUser) {
    return NextResponse.json(
      {
        state: 'error',
        message: 'You can not unlike this post, login first.',
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
        message: 'No data found to unlike the post.',
      },
      {
        status: 400,
      },
    );
  }

  try {
    const validateData = reactPost.parse(data);

    const userId = verifyUser.id;

    await DBConn();

    const foundUser = await userModel.findById(userId);

    const blockedFilteredUsers = await userModel.find({
      $and: [
        {
          _id: {
            $nin: Array.isArray(foundUser.blockedUsers)
              ? foundUser.blockedUsers
              : [],
          },
        },
        {
          blockedUsers: { $nin: [userId] },
        },
      ],
    });

    let safeAuthors = [];

    safeAuthors.push(blockedFilteredUsers.map((user) => user._id));

    const postDocument = await postModel.findById(validateData.postId);

    if (safeAuthors.includes(postDocument.author)) {
      return NextResponse.json(
        {
          state: 'error',
          message: 'Post not found.',
        },
        {
          status: 404,
        },
      );
    }

    if (!postDocument.reactLoves.includes(userId)) {
      return NextResponse.json(
        {
          state: 'error',
          message: 'You have not liked this post yet.',
        },
        {
          status: 409,
        },
      );
    }

    const unlikedPostDocument = await postModel.findByIdAndUpdate(
      validateData.postId,
      {
        $pull: {
          reactLoves: userId,
        },
      },
      { new: true },
    );

    return NextResponse.json({
      state: 'success',
      message: 'Like has been removed from the post.',
      data: unlikedPostDocument,
    });
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

    console.error('Failed in Unliking post: ', error);

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
