import DBConn from '@/lib/DBConn';
import { verifyToken } from '@/lib/jwt';
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
        message: 'User deleted, ready to delete token.',
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
