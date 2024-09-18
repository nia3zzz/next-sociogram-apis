import DBConn from '@/lib/DBConn';
import { verifyToken } from '@/lib/jwt';
import { updateProfile } from '@/middlewares/userZod';
import userModel from '@/models/userModel';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export const POST = async (req: Request) => {
  const verifyUser = verifyToken(process.env.JWT_SECRET as string, req);

  if (!verifyUser) {
    return NextResponse.json(
      {
        state: 'error',
        message: 'Not verified to update profile, login first.',
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
        message: "Can't continue without any data to update user profile.",
      },
      { status: 400 },
    );
  }

  try {
    const validateData = updateProfile.parse(data);

    await DBConn();

    const updateUser = await userModel.findByIdAndUpdate(userId, validateData);

    return NextResponse.json(
      {
        state: 'success',
        messsage: 'User updated.',
        validateData,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('Update profile validation.', error.errors);
      return NextResponse.json(
        {
          state: 'error',
          message: 'Failed in type validation.',
          errors: error.errors[0].message,
        },
        { status: 422 },
      );
    }

    console.error('Error in update profile', error);
    return NextResponse.json(
      {
        state: 'error',
        message: 'Something went wrong.',
      },
      { status: 500 },
    );
  }
};
