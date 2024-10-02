import DBConn from '@/lib/DBConn';
import { verifyToken } from '@/lib/jwt';
import sendMail from '@/lib/nodemailer';
import userModel from '@/models/userModel';
import { NextResponse } from 'next/server';

export const DELETE = async (req: Request) => {
  const verifyUser = verifyToken(process.env.JWT_SECRET as string, req);

  if (!verifyUser) {
    return NextResponse.json(
      {
        state: 'error',
        message: 'To delete your account, login first',
      },
      {
        status: 401,
      },
    );
  }

  const userId = verifyUser.id;

  try {
    await DBConn();

    const foundUser = await userModel.findById({ _id: userId });

    await sendMail(foundUser.email);

    return NextResponse.json(
      {
        state: 'success',
        message:
          'Enter code to delete your account, code has been sent to your email.',
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error('Deleting user failed,', error);
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
