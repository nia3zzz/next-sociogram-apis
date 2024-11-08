import DBConn from '@/lib/DBConn';
import cloudinary from '@/middlewares/cloudinary';
import { hash } from '@/middlewares/hashFunc';
import { userSignup } from '@/middlewares/userZod';
import userModel from '@/models/userModel';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

interface CloudinaryUploadResult {
  public_id: string;
  [key: string]: any;
}

export const POST = async (req: Request) => {
  const data = await req.formData();

  if (!data) {
    return NextResponse.json(
      {
        state: 'error',
        message: "Can't continue without any information.",
      },
      { status: 400 },
    );
  }

  const name = data.get('name');
  const userName = data.get('userName');
  const email = data.get('email');
  const telePhone = data.get('telePhone');
  const gender = data.get('gender');
  const bio = data.get('bio');
  const following = data.getAll('following');
  const password = data.get('password');
  const confirmPassword = data.get('confirmPassword');

  if (password !== confirmPassword) {
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

  try {
    const validateData = userSignup.parse({
      name,
      userName,
      email,
      telePhone,
      gender,
      bio,
      following,
      password,
      confirmPassword,
    });

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

    if (validateData.telePhone !== null) {
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

    if (validateData.following && validateData.following.length > 0) {
      for (let i = 0; i < validateData.following.length; i++) {
        const checkUserExists = await userModel.findById({
          _id: validateData.following[i],
        });

        if (!checkUserExists) {
          return NextResponse.json(
            {
              state: 'error',
              message: `No user found with this Id, ${validateData.following[i]}`,
            },
            {
              status: 400,
            },
          );
        }
      }
    }
    const hashedPassword = await hash(validateData.password);

    const file = data.get('profilePic') as File | null;

    if (!file) {
      const user = await userModel.create({
        name: validateData.name,
        userName: validateData.userName,
        email: validateData.email,
        telePhone: validateData.telePhone,
        gender: validateData.gender,
        bio: validateData.bio,
        following: validateData.following,
        password: hashedPassword,
      });

      if (validateData.following && validateData.following.length > 0) {
        for (let i = 0; i < validateData.following.length; i++) {
          await userModel.findByIdAndUpdate(
            validateData.following[i],
            {
              $push: {
                followers: user._id,
              },
            },
            {
              new: false,
            },
          );
        }
      }

      return NextResponse.json(
        {
          state: 'success',
          message: 'User created successfully',
          userId: user._id,
        },
        { status: 201 },
      );
    }

    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validImageTypes.includes(file && file.type)) {
      return NextResponse.json(
        {
          state: 'error',
          message: 'Invalid image file type.',
        },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<CloudinaryUploadResult>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: '/sociogram-apis' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result as CloudinaryUploadResult);
          },
        );
        uploadStream.end(buffer);
      },
    );

    const user = await userModel.create({
      name: validateData.name,
      userName: validateData.userName,
      email: validateData.email,
      telePhone: validateData.telePhone,
      gender: validateData.gender,
      bio: validateData.bio,
      profilePic: result.secure_url,
      following: validateData.following,
      password: hashedPassword,
    });

    if (validateData.following && validateData.following.length > 0) {
      for (let i = 0; i < validateData.following.length; i++) {
        await userModel.findByIdAndUpdate(
          validateData.following[i],
          {
            $push: {
              followers: user._id,
            },
          },
          {
            new: false,
          },
        );
      }
    }

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
