import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import verifyMailModel from '@/models/verifyMail';
import DBConn from './DBConn';
import userModel from '@/models/userModel';
import { hash } from '@/middlewares/hashFunc';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASSWORD,
  },
});

const sendMail = async (userEmail: string) => {
  try {
    const verificationCode = Math.floor(100000 + Math.random() * 900000);

    const hashedVerifictionCode = await hash(verificationCode);

    await DBConn();

    const foundUser = await userModel.findOne({ email: userEmail });

    await verifyMailModel.create({
      author: foundUser._id,
      verifyHashedCode: hashedVerifictionCode,
    });

    const info = await transporter.sendMail({
      from: `"Sociogram" <${process.env.AUTH_EMAIL}>`,
      to: userEmail,
      subject: 'Sociogram - Email Verification Code',
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">Email Verification</h2>
        <p style="color: #555; line-height: 1.6;">
          Hi there,
        </p>
        <p style="color: #555; line-height: 1.6;">
          Thank you for using Sociogram! To complete your action, please use the following verification code:
        </p>
        <div style="text-align: center; font-size: 24px; font-weight: bold; padding: 10px 0; color: #333; background-color: #f9f9f9; border: 1px solid #ddd; border-radius: 5px;">
          ${verificationCode}
        </div>
        <p style="color: #555; line-height: 1.6;">
          Enter this code in the verification section to complete your action.
        </p>
        <p style="color: #555; line-height: 1.6;">
          If you didn't request this email, you can safely ignore it.
        </p>
        <br>
        <p style="color: #555; line-height: 1.6;">
          Best regards,<br>
          The Sociogram Team
        </p>
      </div>
    `,
    });

    console.log('Message sent: %s', info.response);
  } catch (error) {
    console.error('Error sending email', error);
    return NextResponse.json(
      {
        state: 'error',
        message: 'Error sending email.',
      },
      {
        status: 500,
      },
    );
  }
};

export default sendMail;
