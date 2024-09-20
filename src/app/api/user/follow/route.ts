import DBConn from '@/lib/DBConn';
import { verifyToken } from '@/lib/jwt';
import { followUser } from '@/middlewares/userZod';
import userModel from '@/models/userModel';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export const POST = async (req: Request) => {
  const verifyUser = verifyToken(process.env.JWT_SECRET as string, req);

  if (!verifyUser) {
    return NextResponse.json(
      {
        state: 'error',
        message: "Can't follow this user, login first",
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
        message: "Can't continue without Id info to follow.",
      },
      { status: 400 },
    );
  }

  try {
    const validateData = followUser.parse(data);

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

    const addFollow = await userModel.findByIdAndUpdate(
      UserId,
      {
        $push: {
          following: validateData.id,
        },
      },
      {
        new: true,
      },
    );

    return NextResponse.json(
      {
        state: 'success',
        message: 'User followed.',
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('Follow user validation failed', error.errors);
      return NextResponse.json(
        {
          state: 'error',
          message: 'Follow user validation failed.',
          errors: error.errors[0].message,
        },
        { status: 400 },
      );
    }

    console.error('User following failed', error);
    return NextResponse.json(
      {
        state: 'error',
        message: 'Something went wrong.',
      },
      { status: 500 },
    );
  }
};
