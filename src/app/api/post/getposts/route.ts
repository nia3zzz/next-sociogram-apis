import postModel from '@/models/postModel';
import userModel from '@/models/userModel';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import DBConn from '@/lib/DBConn';

export const GET = async (req: Request) => {
  const verifyUser = verifyToken(process.env.JWT_SECRET as string, req);

  try {
    await DBConn();

    if (verifyUser) {
      const userId = verifyUser.id;

      const foundUser = await userModel.findById({ _id: userId });

      const blockedFilteredUsers = await userModel.find({
        $and: [
          {
            _id: {
              $nin: Array.isArray(foundUser.blockedUsers)
                ? foundUser.blockedUsers
                : [],
            },
          },
          {
            blockedUsers: { $nin: [userId] },
          },
        ],
      });

      const postDocuments = await postModel.find({
        author: {
          $in: blockedFilteredUsers.map((user) => user._id),
        },
      });

      return NextResponse.json({
        state: 'success',
        message: 'Posts has been fetched.',
        data: postDocuments,
      });
    }

    const postDocuments = await postModel.find();

    return NextResponse.json({
      state: 'success',
      message: 'Posts has been fetched.',
      data: postDocuments,
    });
  } catch (error) {
    console.error('Error getting posts: ', error);

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
