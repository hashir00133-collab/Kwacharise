import { NextResponse } from "next/server";
import { buildEmailTemplate, sendEmail } from "@/lib/email/sendEmail";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Test email route is disabled in production." },
      { status: 403 }
    );
  }

  const testEmail = process.env.RESEND_FROM_EMAIL;

  if (!testEmail) {
    return NextResponse.json(
      { error: "RESEND_FROM_EMAIL is missing in .env.local" },
      { status: 500 }
    );
  }

  try {
    const html = buildEmailTemplate({
      title: "KwachaRise Email Test",
      message:
        "This is a test email from the local KwachaRise system. If you received this, Resend email setup is working correctly.",
      actionText: "Open KwachaRise",
      actionUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    });

    const data = await sendEmail({
      to: testEmail,
      subject: "KwachaRise Email Test",
      html,
      text: "This is a test email from KwachaRise.",
    });

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${testEmail}`,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send email.",
      },
      { status: 500 }
    );
  }
}