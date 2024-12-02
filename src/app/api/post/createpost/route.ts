import { createPost } from '@/middlewares/postZod';
import postModel from '@/models/postModel';
import { verifyToken } from '@/lib/jwt';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import cloudinary from '@/middlewares/cloudinary';
import DBConn from '@/lib/DBConn';

interface CloudinaryUploadResult {
  public_id: string;
  [key: string]: any;
}

export const POST = async (req: Request) => {
  const verifyUser = verifyToken(process.env.JWT_SECRET as string, req);

  if (!verifyUser) {
    return NextResponse.json(
      {
        state: 'error',
        message: 'Can not create a post, login first',
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
        message: 'Can not create a post without post info.',
      },
      {
        status: 400,
      },
    );
  }

  const caption = data.get('caption');
  try {
    const validateData = createPost.parse({ caption });

    const files = data.getAll('contentFiles') as File[] | null;

    if (!files && !validateData.caption) {
      return NextResponse.json(
        {
          state: 'error',
          message: 'Can not create an empty post.',
        },
        {
          status: 400,
        },
      );
    }

    await DBConn();

    if (!files && validateData.caption) {
      const createPostDocument: { Id: string } = await postModel.create({
        author: userId,
        caption: validateData.caption,
      });

      return NextResponse.json(
        {
          state: 'success',
          message: 'Your post has been posted.',
          postId: createPostDocument.Id,
        },
        {
          status: 200,
        },
      );
    }

    let filesSecureUrl = [];

    if (files) {
      const supportedFormats = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'video/mp4',
        'image/gif',
        'webm',
      ];

      for (let i = 0; i < files.length; i++) {
        if (!supportedFormats.includes(files[i].type)) {
          return NextResponse.json(
            {
              state: 'error',
              message: 'Invalid file type.',
            },
            {
              status: 400,
            },
          );
        }

        const bytes = await files[i].arrayBuffer();
        const buffer = Buffer.from(bytes);

        const result = await new Promise<CloudinaryUploadResult>(
          (resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: '/sociogram-apis',
                resource_type: 'auto',
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result as CloudinaryUploadResult);
              },
            );
            uploadStream.end(buffer);
          },
        );
        filesSecureUrl.push(result.secure_url);
      }
    }

    if (!validateData.caption) {
      const createPostDocument = await postModel.create({
        author: userId,
        contentFiles: filesSecureUrl,
      });

      return NextResponse.json(
        {
          state: 'error',
          message: 'Your post has been posted.',
          postId: createPostDocument.Id,
        },
        {
          status: 200,
        },
      );
    }

    const createPostDocument: { Id: string } = await postModel.create({
      author: userId,
      caption: validateData.caption,
      contentFiles: filesSecureUrl,
    });

    return NextResponse.json({
      state: 'success',
      message: 'Your post has been posted.',
      postId: createPostDocument.Id,
    });
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

    console.error('Failed in createPostDocument', error);
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
