import DBConn from '@/lib/DBConn';
import { verifyToken } from '@/lib/jwt';
import { follow_UnfollowUser } from '@/middlewares/userZod';
import userModel from '@/models/userModel';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export const POST = async (req: Request) => {
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

  const UserId = verifyUser.id;

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

    const checkUserExists = await userModel.findById({ _id: validateData.id });

    if (!checkUserExists) {
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

    await userModel.findByIdAndUpdate(
      UserId,
      {
        $pull: {
          following: validateData.id,
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
