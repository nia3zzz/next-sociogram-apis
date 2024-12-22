import postModel from '@/models/postModel';
import userModel from '@/models/userModel';
import DBConn from '@/lib/DBConn';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

interface Iparams {
  id: string;
}

export const GET = async (req: Request, { params }: { params: Iparams }) => {
  const verifyUser = verifyToken(process.env.JWT_SECRET as string, req);

  try {
    await DBConn();

    if (verifyUser) {
      const userId = verifyUser.id;

      const foundUser = await userModel.findById(userId);

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

      let safeAuthors = [];

      safeAuthors.push(blockedFilteredUsers.map((user) => user._id));

      const postDocument = await postModel.findById(params.id);

      if (!postDocument) {
        return NextResponse.json(
          {
            state: 'error',
            message: 'No post found with this id.',
          },
          {
            status: 409,
          },
        );
      }

      if (!safeAuthors.includes(postDocument.author)) {
        return NextResponse.json(
          {
            state: 'error',
            message: 'Post not found.',
          },
          {
            status: 404,
          },
        );
      }

      return NextResponse.json({
        state: 'success',
        message: 'Post has been fetched.',
        data: postDocument,
      });
    }

    const postDocument = await postModel.findById(params.id);

    if (!postDocument) {
      return NextResponse.json(
        {
          state: 'error',
          messsage: 'No post found with this id.',
        },
        {
          status: 409,
        },
      );
    }

    return NextResponse.json({
      state: 'success',
      message: 'Post has been fetched.',
      data: postDocument,
    });
  } catch (error) {
    console.error('Failed in get post by id route: ', error);

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
