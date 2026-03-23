import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import dbConnect from '@/lib/mongodb';
import Otp from '@/models/otp.model';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
    },
});

export async function POST(request) {
    try {
        // 1. Connect to MongoDB
        await dbConnect();

        // 2. Parse the incoming request body
        const body = await request.json();
        const { email, fullName, mode } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // 3. Generate a 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        // 4. Save/Update in MongoDB (Upsert)
        await Otp.findOneAndUpdate(
            { email },
            { otp: otpCode, createdAt: Date.now() },
            { upsert: true, new: true }
        );

        // 5. Send the email
        await transporter.sendMail({
            from: `"SPECTRUM APC" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Your SPECTRUM Login Code',
            html: `
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #5AE0FE; padding: 60px 20px; font-family: Arial, Helvetica, sans-serif;">
  <tr>
    <td align="center">
      
      <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border: 4px solid #000000; border-radius: 24px; text-align: center; box-shadow: 8px 8px 0px #000000; overflow: hidden;">
        
        <div style="background-color: #FF90E8; border-bottom: 4px solid #000000; padding: 30px 20px;">
          <p style="margin: 0 0 5px 0; font-size: 12px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; color: #000000;">
            Art & Photography Club
          </p>
          <h2 style="margin: 0; font-size: 38px; font-weight: 900; text-transform: uppercase; color: #000000; letter-spacing: -1px;">
            SPECTRUM '26
          </h2>
        </div>
        
        <div style="padding: 40px 30px;">
          <p style="margin: 0 0 30px 0; font-size: 18px; font-weight: bold; color: #000000;">
            Welcome! Your secure entry code is:
          </p>
          
          <div style="background-color: #F6E245; border: 4px solid #000000; border-radius: 16px; padding: 25px 10px; margin: 0 auto 30px auto; max-width: 280px; box-shadow: 4px 4px 0px #000000;">
            <h1 style="margin: 0; font-size: 46px; font-weight: 900; letter-spacing: 12px; color: #000000;">
              ${otpCode}
            </h1>
          </div>
          
          <p style="margin: 0 0 10px 0; font-size: 15px; font-weight: bold; color: #000000;">
            This code expires in <span style="background-color: #000000; color: #ffffff; padding: 4px 10px; border-radius: 6px; font-size: 13px;">5 MINUTES</span>
          </p>
          
          <hr style="border: none; border-top: 3px dashed #cccccc; margin: 30px 0;">
          
          <p style="margin: 0; font-size: 13px; font-weight: bold; color: #888888;">
            Didn't request this? You can safely ignore this email.
          </p>
        </div>

      </div>

    </td>
  </tr>
</table>
`,
        });

        return NextResponse.json({ message: 'OTP sent successfully' }, { status: 200 });

    } catch (error) {
        console.error("OTP Send Error:", error);
        return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
    }
}