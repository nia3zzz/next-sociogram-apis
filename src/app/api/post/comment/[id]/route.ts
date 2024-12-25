// route = /comment/id

//      method=get
//      id=params(postid)
//      res=all comments

//      method=post
//      id=params(postid)
//      body=json type data

//      method=put
//      id=params(commentid)
//      body=json type data

//      method=delete
//      id=params(postid)

import userModel from '@/models/userModel';
import postModel from '@/models/postModel';
import { verifyToken } from '@/lib/jwt';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import DBConn from '@/lib/DBConn';
import { createComment } from '@/middlewares/postZod';
import commentModel from '@/models/commentModel';

interface IParams {
  id: string;
}

export const POST = async (req: Request, { params }: { params: IParams }) => {
  const verifyUser = verifyToken(process.env.JWT_SECRET as string, req);

  if (!verifyUser) {
    return NextResponse.json(
      {
        state: 'error',
        message: 'Can not comment on this post, login first',
      },
      {
        status: 401,
      },
    );
  }

  const data = await req.json();

  if (!data) {
    return NextResponse.json(
      {
        state: 'error',
        message: 'Can not post an empty comment.',
      },
      {
        status: 400,
      },
    );
  }

  try {
    const validateData = createComment.parse(data);

    const userId = verifyUser.id;

    await DBConn();

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

    const safeAuthors = blockedFilteredUsers.map((user) => user._id.toString());

    const postDocument = await postModel.findById(params.id);

    if (!postDocument) {
      return NextResponse.json(
        {
          state: 'error',
          message: `No post found with id ${params.id}`,
        },
        {
          status: 404,
        },
      );
    }

    if (!safeAuthors.includes(postDocument.author.toString())) {
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

    const commentDocument = await commentModel.create({
      postCommentedOn: params.id,
      commentAuthor: userId,
      content: validateData.comment,
    });

    const commentOnPost = await postModel.findByIdAndUpdate(
      params.id,
      {
        $push: {
          comments: commentDocument._id,
        },
      },
      {
        new: true,
      },
    );

    return NextResponse.json(
      {
        state: 'success',
        message: 'Your comment has been added.',
        data: commentOnPost,
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
          status: 400,
        },
      );
    }

    console.error('Failed in comment post route: ', error);
    NextResponse.json(
      {
        state: 'error',
        message: 'Internal Server Error.',
      },
      {
        status: 500,
      },
    );
  }
};
