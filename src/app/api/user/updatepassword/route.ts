import DBConn from '@/lib/DBConn';
import { verifyToken } from '@/lib/jwt';
import { decode, hash } from '@/middlewares/hashFunc';
import { updatePassword } from '@/middlewares/userZod';
import userModel from '@/models/userModel';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export const PUT = async (req: Request) => {
  const verifyUser = verifyToken(process.env.JWT_SECRET as string, req);

  if (!verifyUser) {
    return NextResponse.json(
      {
        state: 'error',
        message: 'To change your password login first.',
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
        message: "Can't continue without any information.",
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

  if (
    data?.previousPassword === data?.newPassword &&
    data?.newPassword === data?.confirmNewPassword
  ) {
    return NextResponse.json(
      {
        state: 'error',
        message: "Can't update to old password.",
      },
      {
        status: 400,
      },
    );
  }
  try {
    const validateData = updatePassword.parse(data);

    await DBConn();

    const foundUser = await userModel.findById(userId);

    const passwordMatched = await decode(
      validateData.previousPassword,
      foundUser.password,
    );

    if (!passwordMatched) {
      return NextResponse.json(
        {
          state: 'error',
          message: 'Incorrect password, try again',
        },
        {
          status: 401,
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
      return NextResponse.json(
        {
          state: 'error',
          message: 'Failed in type validation.',
          errors: error.errors[0].message,
        },
        {
          status: 422,
        },
      );
    }

    console.error('Error updating password', error);
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
