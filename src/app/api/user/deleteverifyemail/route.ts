import DBConn from '@/lib/DBConn';
import { verifyToken } from '@/lib/jwt';
import { decode } from '@/middlewares/hashFunc';
import { verificationCodeDelete } from '@/middlewares/userZod';
import userModel from '@/models/userModel';
import verifyMailModel from '@/models/verifyMail';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export const DELETE = async (req: Request) => {
  const verifyUser = verifyToken(process.env.JWT_SECRET as string, req);

  if (!verifyUser) {
    return NextResponse.json(
      {
        state: 'error',
        message: "Can't delete this account, login first",
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
        message: 'Verification code was not provided.',
      },
      {
        status: 400,
      },
    );
  }

  try {
    const validateData = verificationCodeDelete.parse(data);

    await DBConn();

    const foundUser = await userModel.findById({
      _id: userId,
    });

    const verificationCodeDocument = await verifyMailModel.findOne({
      author: foundUser._id,
    });

    if (!verificationCodeDocument) {
      return NextResponse.json(
        {
          state: 'errpr',
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

    await userModel.deleteOne({ _id: userId });

    await userModel.updateMany(
      { following: userId },
      { $pull: { following: userId } },
    );

    await userModel.updateMany(
      { followers: userId },
      { $pull: { followers: userId } },
    );

    await userModel.updateMany(
      { blockedUsers: userId },
      { $pull: { blockedUsers: userId } },
    );

    return NextResponse.json(
      {
        state: 'success',
        message: 'User deleted.',
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('Delete user validation failed.');
      return NextResponse.json({
        state: 'error',
        message: 'Failed in type validation',
        errors: error.errors[0].message,
      });
    }

    console.error('Delete user failed: ', error);
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
