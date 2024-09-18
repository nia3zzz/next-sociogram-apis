import DBConn from '@/lib/DBConn';
import { verifyToken } from '@/lib/jwt';
import userModel from '@/models/userModel';
import { NextResponse } from 'next/server';

interface Iparams {
  username: string;
}

export const GET = async (req: Request, { params }: { params: Iparams }) => {
  const { username } = params;

  if (!username || username === '') {
    return NextResponse.json(
      { state: 'error', message: 'Provide an username to look for.' },
      {
        status: 400,
      },
    );
  }

  try {
    await DBConn();

    const retrieveUser = await userModel.findOne({ userName: username });

    if (!retrieveUser) {
      return NextResponse.json(
        {
          state: 'error',
          messsage: 'No user found with this username.',
        },
        {
          status: 404,
        },
      );
    }

    const verifyUser = verifyToken(process.env.JWT_SECRET as string, req);

    const checkSelfProfileRequest = retrieveUser.email;

    if (verifyUser?.email === checkSelfProfileRequest) {
      return NextResponse.json(
        {
          state: 'success',
          message: 'User found.',
          id: retrieveUser._id,
          name: retrieveUser.name,
          username: retrieveUser.userName,
          email: retrieveUser.email,
          telePhone: retrieveUser.telePhone,
          gender: retrieveUser.gender,
          profilePic: retrieveUser.profilePic,
          bio: retrieveUser.bio,
          following: retrieveUser.following,
          followers: retrieveUser.followers,
          joinedOn: retrieveUser.createdAt,
          lastEdited: retrieveUser.updatedAt,
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        state: 'success',
        message: 'User found.',
        id: retrieveUser._id,
        name: retrieveUser.name,
        username: retrieveUser.userName,
        email: retrieveUser.email,
        profilePic: retrieveUser.profilePic,
        bio: retrieveUser.bio,
        following: retrieveUser.following,
        followers: retrieveUser.followers,
        joinedOn: retrieveUser.created_at,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error sending profile info', error);
    return NextResponse.json(
      { state: 'error', messsage: 'Something went wrong.' },
      {
        status: 500,
      },
    );
  }
};
