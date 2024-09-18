import jwt, { JwtPayload } from 'jsonwebtoken';
import { NextResponse } from 'next/server';

interface IfoundUser {
  _id: string;
  email: string;
}

interface TokenPayload extends JwtPayload {
  id: string;
  email: string;
}

const initializeToken = (foundUser: IfoundUser) => {
  const secret = process.env.JWT_SECRET as string;

  if (!secret) {
    return NextResponse.json(
      { state: 'error', message: 'No JWT_SECRET variable stored in server.' },
      { status: 500 },
    );
  }
  try {
    const token = jwt.sign(
      {
        id: foundUser._id,
        email: foundUser.email,
      },
      secret,
      {
        expiresIn: '30d',
      },
    );

    return NextResponse.json(
      { state: 'success', message: 'Login Successful, token recieved', token },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error initializing token', error);
    return NextResponse.json(
      { state: 'error', message: 'Something went wrong.' },
      { status: 500 },
    );
  }
};

const verifyToken = (secretKey: string, req: Request) => {
  const authHeader = req.headers.get('authorization');

  if (!authHeader) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, secretKey) as TokenPayload;
    return decoded;
  } catch (error) {
    console.error('Token verification failed', error);
    return null;
  }
};

export { initializeToken, verifyToken };
