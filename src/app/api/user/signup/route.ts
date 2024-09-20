import DBConn from '@/lib/DBConn';
import { hash } from '@/middlewares/hashFunc';
import { userSignup } from '@/middlewares/userZod';
import userModel from '@/models/userModel';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export const POST = async (req: Request) => {
  const data = await req.json();

  if (!data) {
    return NextResponse.json(
      {
        state: 'error',
        message: "Can't continue without any information.",
      },
      { status: 400 },
    );
  }
  try {
    const validateData = userSignup.parse(data);

    await DBConn();

    const duplicateUserName = await userModel.findOne({
      userName: validateData.userName,
    });
    if (duplicateUserName) {
      return NextResponse.json(
        { state: 'error', message: 'User with same username already exists.' },
        { status: 409 },
      );
    }

    const duplicateEmail = await userModel.findOne({
      email: validateData.email,
    });

    if (duplicateEmail) {
      return NextResponse.json(
        {
          state: 'error',
          message: 'User with same email already exists.',
        },
        {
          status: 409,
        },
      );
    }

    if (validateData.telePhone === null) {
      const duplicateTelePhone = await userModel.findOne({
        telePhone: validateData.telePhone,
      });

      if (duplicateTelePhone) {
        return NextResponse.json(
          {
            state: 'error',
            message: 'User with same phone number already exists.',
          },
          { status: 409 },
        );
      }
    }
    const hashedPassword = await hash(validateData.password);

    const user = await userModel.create({
      name: validateData.name,
      userName: validateData.userName,
      email: validateData.email,
      telePhone: validateData.telePhone,
      gender: validateData.gender,
      profilePic: validateData.profilePic,
      bio: validateData.bio,
      following: validateData.following,
      password: hashedPassword,
    });

    return NextResponse.json(
      {
        state: 'success',
        message: 'User created successfully',
        userId: user._id,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('Signup validation failed.', error.errors);
      return NextResponse.json(
        {
          state: 'error',
          message: 'Failed in type validation.',
          errors: error.errors[0].message,
        },
        { status: 422 },
      );
    }
    console.error('Error signing up', error);
    return NextResponse.json(
      { state: 'error', message: 'Something went wrong.' },
      {
        status: 500,
      },
    );
  }
};
