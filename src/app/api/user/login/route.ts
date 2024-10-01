import { NextResponse } from 'next/server';
import userModel from '@/models/userModel';
import { decode } from '@/middlewares/hashFunc';
import { initializeToken } from '@/lib/jwt';
import { userLogin } from '@/middlewares/userZod';
import DBConn from '@/lib/DBConn';
import { ZodError } from 'zod';
import sendMail from '@/lib/nodemailer';

export const POST = async (req: Request) => {
  const data = await req.json();

  if (!data) {
    return NextResponse.json(
      {
        state: 'error',
        message: "Can't continue without any information.",
      },
      {
        status: 400,
      },
    );
  }
  try {
    const validateData = userLogin.parse(data);

    let user;

    await DBConn();

    if (validateData.email) {
      user = await userModel.findOne({ email: validateData.email });
    } else if (validateData.telePhone) {
      user = await userModel.findOne({ telePhone: validateData.telePhone });
    } else if (validateData.userName) {
      user = await userModel.findOne({ userName: validateData.userName });
    }

    if (!user) {
      return NextResponse.json(
        { state: 'error', message: 'User not found' },
        {
          status: 404,
        },
      );
    }

    if (!user?.isVerified) {
      await sendMail(user.email);

      return NextResponse.json(
        {
          state: 'error',
          message: 'Authenticate yourself, code has been sent to your email.',
        },
        {
          status: 401,
        },
      );
    }

    const hashedPassword = await decode(validateData.password, user.password);

    if (!hashedPassword) {
      return NextResponse.json(
        { state: 'error', message: 'Password is not corrent.' },
        { status: 401 },
      );
    }

    return initializeToken(user);
  } catch (error) {
    console.error('Error logging in', error);
    if (error instanceof ZodError) {
      console.error('Signup validation failed.', error.errors);
      return NextResponse.json(
        {
          state: 'error',
          message: 'Failed in type validation.',
          errors: error.errors[0].message,
        },
        { status: 422 },
      );
    }
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
