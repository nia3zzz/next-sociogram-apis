import DBConn from '@/lib/DBConn';
import { verifyToken } from '@/lib/jwt';
import cloudinary from '@/middlewares/cloudinary';
import { updateProfile } from '@/middlewares/userZod';
import userModel from '@/models/userModel';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

interface CloudinaryUploadResult {
  public_id: string;
  [key: string]: any;
}

export const PUT = async (req: Request) => {
  const verifyUser = verifyToken(process.env.JWT_SECRET as string, req);

  if (!verifyUser) {
    return NextResponse.json(
      {
        state: 'error',
        message: 'Not verified to update profile, login first.',
      },
      {
        status: 401,
      },
    );
  }

  const userId = verifyUser.id;

  const data = await req.formData();

  if (!data) {
    return NextResponse.json(
      {
        state: 'error',
        message: "Can't continue without any data to update user profile.",
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

  try {
    const validateData = updateProfile.parse({
      name,
      userName,
      email,
      telePhone,
      gender,
      bio,
    });

    await DBConn();

    const foundUser = await userModel.findById({
      _id: userId,
    });

    if (validateData.userName !== foundUser.userName) {
      const checkUserNameExists = await userModel.findOne({
        userName: validateData.userName,
      });

      if (checkUserNameExists) {
        return NextResponse.json(
          {
            state: 'error',
            message: 'Username has already been taken, try another.',
          },
          {
            status: 409,
          },
        );
      }
    }

    if (validateData.email !== foundUser.email) {
      const checkEmailExists = await userModel.findOne({
        email: validateData.email,
      });

      if (checkEmailExists) {
        return NextResponse.json(
          {
            state: 'error',
            message: 'Email has already been taken, try another.',
          },
          {
            status: 409,
          },
        );
      }
    }

    if (
      validateData.telePhone &&
      validateData.telePhone !== foundUser.telePhone
    ) {
      const checkTelePhoneExists = await userModel.findOne({
        telePhone: validateData.telePhone,
      });

      if (checkTelePhoneExists) {
        return NextResponse.json(
          {
            state: 'error',
            message: 'Telephone number has already been taken, try another.',
          },
          {
            status: 409,
          },
        );
      }
    }

    const file = data.get('profilePic') as File | null;

    if (!file && validateData.email !== foundUser.email) {
      await userModel.findByIdAndUpdate(userId, {
        name: validateData.name,
        userName: validateData.userName,
        email: validateData.email,
        telePhone: validateData.telePhone,
        gender: validateData.gender,
        bio: validateData.bio,
        isVerified: false,
      });

      return NextResponse.json(
        {
          state: 'success',
          messsage: 'User updated, ready to remove JWT token from frontend.',
          updatedValues: {
            name: validateData.name,
            userName: validateData.userName,
            email: validateData.email,
            telePhone: validateData.telePhone,
            gender: validateData.gender,
            bio: validateData.bio,
            isVerified: false,
          },
        },
        { status: 200 },
      );
    }

    if (!file) {
      await userModel.findByIdAndUpdate(userId, {
        name: validateData.name,
        userName: validateData.userName,
        email: validateData.email,
        telePhone: validateData.telePhone,
        gender: validateData.gender,
        bio: validateData.bio,
      });

      return NextResponse.json(
        {
          state: 'success',
          messsage: 'User updated.',
          updatedValues: {
            name: validateData.name,
            userName: validateData.userName,
            email: validateData.email,
            telePhone: validateData.telePhone,
            gender: validateData.gender,
            bio: validateData.bio,
          },
        },
        { status: 200 },
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

    if (validateData.email === foundUser.email) {
      await userModel.findByIdAndUpdate(userId, {
        name: validateData.name,
        userName: validateData.userName,
        email: validateData.email,
        telePhone: validateData.telePhone,
        gender: validateData.gender,
        bio: validateData.bio,
        profilePic: result.secure_url,
      });

      return NextResponse.json(
        {
          state: 'success',
          messsage: 'User updated.',
          updatedValues: {
            name: validateData.name,
            userName: validateData.userName,
            email: validateData.email,
            telePhone: validateData.telePhone,
            gender: validateData.gender,
            bio: validateData.bio,
            profilePic: result.secure_url,
          },
        },
        { status: 200 },
      );
    }

    if (validateData.email !== foundUser.email) {
      await userModel.findByIdAndUpdate(userId, {
        name: validateData.name,
        userName: validateData.userName,
        email: validateData.email,
        telePhone: validateData.telePhone,
        gender: validateData.gender,
        bio: validateData.bio,
        profilePic: result.secure_url,
        isVerified: false,
      });

      return NextResponse.json(
        {
          state: 'success',
          messsage: 'User updated, ready to remove JWT token from frontend.',
          updatedValues: {
            name: validateData.name,
            userName: validateData.userName,
            email: validateData.email,
            telePhone: validateData.telePhone,
            gender: validateData.gender,
            bio: validateData.bio,
            profilePic: result.secure_url,
            isVerified: false,
          },
        },
        { status: 200 },
      );
    }
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('Update profile validation.', error.errors);
      return NextResponse.json(
        {
          state: 'error',
          message: 'Failed in type validation.',
          errors: error.errors[0].message,
        },
        { status: 422 },
      );
    }

    console.error('Error in update profile', error);
    return NextResponse.json(
      {
        state: 'error',
        message: 'Something went wrong.',
      },
      { status: 500 },
    );
  }
};
