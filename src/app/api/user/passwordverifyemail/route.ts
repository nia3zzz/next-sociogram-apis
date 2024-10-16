import DBConn from '@/lib/DBConn';
import { verifyToken } from '@/lib/jwt';
import { decode, hash } from '@/middlewares/hashFunc';
import { forgotPassword } from '@/middlewares/userZod';
import userModel from '@/models/userModel';
import verifyMailModel from '@/models/verifyMail';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export const PUT = async (req: Request) => {
  const verifyUser = verifyToken(process.env.JWT_SECRET as string, req);

  if (!verifyUser) {
    return NextResponse.json(
      {
        state: 'error',
        message: "Can't update password, login first",
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
        message: "Can't continue without any information",
      },
      {
        status: 400,
      },
    );
  }

  if (data?.newPassword !== data?.confirmNewPassword) {
    return NextResponse.json(
      {
        state: 'error',
        message: 'Passwords do not match.',
      },
      {
        status: 400,
      },
    );
  }

  try {
    const validateData = forgotPassword.parse(data);

    await DBConn();

    const foundUser = await userModel.findById(userId);

    const verificationCodeDocument = await verifyMailModel.findOne({
      author: foundUser._id,
    });

    if (!verificationCodeDocument) {
      return NextResponse.json(
        {
          state: 'error',
          message: 'Code was not generated or might be expired.',
        },
        {
          status: 400,
        },
      );
    }

    const isCodeMatched = await decode(
      validateData.code,
      verificationCodeDocument.verifyHashedCode,
    );

    if (!isCodeMatched) {
      return NextResponse.json(
        {
          state: 'error',
          message: 'Code does not match, try again.',
        },
        {
          status: 422,
        },
      );
    }

    const hashedPassword = await hash(validateData.newPassword);

    await userModel.findByIdAndUpdate(userId, {
      $set: { password: hashedPassword },
    });

    return NextResponse.json(
      {
        state: 'success',
        message: 'Password updated.',
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('Passwordverifyemail validation failed.');
      return NextResponse.json({
        state: 'error',
        message: 'Failed in type validation',
        errors: error.errors[0].message,
      });
    }

    console.error('Failed in passwordverifyemail', error);
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
