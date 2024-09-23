import DBConn from '@/lib/DBConn';
import { verifyToken } from '@/lib/jwt';
import { follow_UnfollowUser } from '@/middlewares/userZod';
import userModel from '@/models/userModel';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export const PUT = async (req: Request) => {
  const verifyUser = verifyToken(process.env.JWT_SECRET as string, req);

  if (!verifyUser) {
    return NextResponse.json(
      {
        state: 'error',
        message: "Can't unfollow this user, login first",
      },
      { status: 401 },
    );
  }

  const userId = verifyUser.id;

  const data = await req.json();

  if (!data) {
    return NextResponse.json(
      {
        state: 'error',
        message: "Can't continue without Id info to unfollow.",
      },
      { status: 400 },
    );
  }

  try {
    const validateData = follow_UnfollowUser.parse(data);

    await DBConn();

    const foundUser = await userModel.findById({ _id: validateData.id });

    if (!foundUser) {
      return NextResponse.json(
        {
          state: 'error',
          message: 'No User found with this id.',
        },
        {
          status: 400,
        },
      );
    }

    const retrieveUser = await userModel.findById({ _id: userId });

    if (!foundUser.followers.includes(userId)) {
      return NextResponse.json(
        {
          state: 'error',
          message: 'Follow the user first to unfollow.',
        },
        {
          status: 409,
        },
      );
    }

    if (foundUser.blockedUsers.includes(userId)) {
      return NextResponse.json(
        {
          state: 'success',
          message: 'You are blocked by this user.',
        },
        {
          status: 403,
        },
      );
    }

    if (retrieveUser.blockedUsers.includes(validateData.id)) {
      return NextResponse.json(
        {
          state: 'success',
          message: 'You blocked this user.',
        },
        {
          status: 403,
        },
      );
    }

    await userModel.findByIdAndUpdate(
      userId,
      {
        $pull: {
          following: validateData.id,
        },
      },
      {
        new: false,
      },
    );

    await userModel.findByIdAndUpdate(
      foundUser._id,
      {
        $pull: {
          followers: userId,
        },
      },
      {
        new: false,
      },
    );

    return NextResponse.json(
      {
        state: 'success',
        message: 'User unfollowed.',
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('Unfollow user validation failed', error.errors);
      return NextResponse.json(
        {
          state: 'error',
          message: 'Unfollow user validation failed.',
          errors: error.errors[0].message,
        },
        { status: 400 },
      );
    }

    console.error('User unfollowing failed', error);
    return NextResponse.json(
      {
        state: 'error',
        message: 'Something went wrong.',
      },
      { status: 500 },
    );
  }
};
