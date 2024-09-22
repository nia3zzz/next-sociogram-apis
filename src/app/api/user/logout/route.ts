import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

export const PUT = async (req: Request) => {
  try {
    const verifyUser = verifyToken(process.env.JWT_SECRET as string, req);

    if (!verifyUser) {
      return NextResponse.json(
        {
          state: 'error',
          message: 'Not verified to logout, login first.',
        },
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        state: 'success',
        message: 'Ready to remove JWT token from frontend.',
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error loging out', error);
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
