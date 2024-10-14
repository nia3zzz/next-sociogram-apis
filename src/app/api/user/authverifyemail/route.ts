import DBConn from '@/lib/DBConn';
import { decode } from '@/middlewares/hashFunc';
import { verificationCodeAuth } from '@/middlewares/userZod';
import userModel from '@/models/userModel';
import verifyMailModel from '@/models/verifyMail';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export const POST = async (req: Request) => {
  const data = await req.json();

  if (!data) {
    return NextResponse.json(
      {
        state: 'error',
        message: 'Verification code was not provided.',
      },
      {
        status: 400,
      },
    );
  }

  try {
    const validateData = verificationCodeAuth.parse(data);

    await DBConn();

    const foundUser = await userModel.findOne({
      email: validateData.email,
    });

    if (!foundUser) {
      return NextResponse.json(
        {
          state: 'error',
          message: 'No user found with this email.',
        },
        {
          status: 404,
        },
      );
    }

    if (foundUser.isVerified) {
      return NextResponse.json(
        {
          state: 'error',
          message: 'Your email is already verified',
        },
        {
          status: 409,
        },
      );
    }

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

    await userModel.findByIdAndUpdate(foundUser._id, {
      $set: {
        isVerified: true,
      },
    });

    return NextResponse.json(
      {
        state: 'success',
        message: 'Your email is now verified.',
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('Verify mail validation failed.');
      return NextResponse.json({
        state: 'error',
        message: 'Failed in type validation',
        errors: error.errors[0].message,
      });
    }

    console.error('Verifying email failed: ', error);
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
