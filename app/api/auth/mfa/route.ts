import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { randomBytes } from "crypto";
import nodemailer from "nodemailer";

const mfaRequestSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  type: z.enum(["email", "sms"]),
});

const mfaVerifySchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  code: z.string().length(6, "验证码必须是6位数字"),
});

// 创建一个简单的内存存储，生产环境应该使用Redis等
type MFACode = {
  code: string;
  createdAt: Date;
  attempts: number;
};

const MFA_CODES: Record<string, MFACode> = {};
const MFA_CODE_EXPIRY = 10 * 60 * 1000; // 10分钟过期
const MAX_ATTEMPTS = 5;

// 创建邮件传输器
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.example.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASSWORD || "",
  },
});

// 请求生成MFA验证码
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, type } = mfaRequestSchema.parse(body);

    // 验证用户是否存在
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 404 }
      );
    }

    // 生成6位数验证码
    const code = randomBytes(3)
      .toString("hex")
      .toUpperCase()
      .substring(0, 6);

    // 存储验证码
    MFA_CODES[email] = {
      code,
      createdAt: new Date(),
      attempts: 0,
    };

    // 根据类型发送验证码
    if (type === "email") {
      await sendEmailCode(email, code, user.name || "用户");
    } else if (type === "sms") {
      // 短信发送功能待实现
      // await sendSmsCode(user.phoneNumber || "", code);
    }

    return NextResponse.json(
      { success: true, message: `验证码已发送到${type === "email" ? "邮箱" : "手机"}` },
      { status: 200 }
    );
  } catch (error) {
    console.error("MFA请求错误:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "请求参数错误", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "服务器错误，请稍后重试" },
      { status: 500 }
    );
  }
}

// 验证MFA验证码
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, code } = mfaVerifySchema.parse(body);

    // 检查验证码是否存在
    const storedCode = MFA_CODES[email];
    if (!storedCode) {
      return NextResponse.json(
        { error: "请先请求验证码" },
        { status: 400 }
      );
    }

    // 检查验证码是否过期
    const now = new Date();
    if (now.getTime() - storedCode.createdAt.getTime() > MFA_CODE_EXPIRY) {
      delete MFA_CODES[email];
      return NextResponse.json(
        { error: "验证码已过期，请重新获取" },
        { status: 400 }
      );
    }

    // 检查尝试次数
    if (storedCode.attempts >= MAX_ATTEMPTS) {
      delete MFA_CODES[email];
      return NextResponse.json(
        { error: "尝试次数过多，请重新获取验证码" },
        { status: 400 }
      );
    }

    // 验证验证码
    if (storedCode.code !== code.toUpperCase()) {
      MFA_CODES[email].attempts += 1;
      return NextResponse.json(
        { error: "验证码错误" },
        { status: 400 }
      );
    }

    // 验证成功，清除验证码
    delete MFA_CODES[email];

    return NextResponse.json(
      { success: true, message: "验证成功" },
      { status: 200 }
    );
  } catch (error) {
    console.error("MFA验证错误:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "请求参数错误", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "服务器错误，请稍后重试" },
      { status: 500 }
    );
  }
}

// 发送邮件验证码
async function sendEmailCode(email: string, code: string, name: string) {
  const mailOptions = {
    from: `"安钢集团永通" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "安钢集团永通订单系统 - 验证码",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
        <h2 style="color: #333;">安钢集团永通订单系统</h2>
        <p>尊敬的 ${name}：</p>
        <p>您好！您正在访问安钢集团永通球墨铸铁管订单管理系统，您的验证码是：</p>
        <div style="background-color: #f0f0f0; padding: 10px; border-radius: 5px; text-align: center; font-size: 24px; letter-spacing: 3px; margin: 20px 0;">
          <strong>${code}</strong>
        </div>
        <p>该验证码将在10分钟后失效，请勿将验证码泄露给他人。</p>
        <p>如果您没有请求此验证码，请忽略此邮件。</p>
        <p style="margin-top: 30px; color: #666; font-size: 12px;">此邮件由系统自动发送，请勿回复。</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
} 