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
        message: "Can't block this user, login first.",
      },
      {
        status: 401,
      },
    );
  }

  const userId = verifyUser.id;

  const data = await req.json();

  if (!data) {
    return NextResponse.json(
      {
        state: 'error',
        message: "Can't continue without id info to block.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const validateData = follow_UnfollowUser.parse(data);

    await DBConn();

    const foundUser = userModel.findById(validateData.id);

    if (!foundUser) {
      return NextResponse.json(
        {
          state: 'error',
          message: 'No user found with this id.',
        },
        {
          status: 400,
        },
      );
    }

    const retrieveUser = await userModel.findOne({ _id: userId });

    if (retrieveUser.blockedUsers.includes(validateData.id)) {
      return NextResponse.json(
        {
          state: 'error',
          message: 'You already blocked this user.',
        },
        {
          status: 403,
        },
      );
    }

    await userModel.findByIdAndUpdate(userId, {
      $push: {
        blockedUsers: validateData.id,
      },
    });

    return NextResponse.json(
      {
        state: 'success',
        message: 'User blocked',
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('Block user validation failed', error.errors);
      return NextResponse.json(
        {
          state: 'error',
          message: 'Block user validation failed.',
          errors: error.errors[0].message,
        },
        {
          status: 400,
        },
      );
    }

    console.error('Block user failed', error);
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
