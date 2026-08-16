import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWhatsAppMessage } from "@/lib/notifications/whatsapp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MaturedDeposit = {
  id: string;
  user_id: string;
  amount: number | null;
  expected_profit: number | null;
  transaction_reference: string | null;
  maturity_status: string | null;
  profit_released_at: string | null;
  maturity_whatsapp_sent_at: string | null;
};

type MemberProfile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: string | null;
  status: string | null;
  whatsapp_notifications_enabled: boolean | null;
  whatsapp_notifications_opt_in: boolean | null;
};

function canReceiveWhatsApp(profile: MemberProfile) {
  return Boolean(
    profile.phone &&
      profile.role === "member" &&
      profile.status !== "blocked" &&
      profile.status !== "suspended" &&
      (profile.whatsapp_notifications_enabled === true ||
        profile.whatsapp_notifications_opt_in === true)
  );
}

export async function POST(request: Request) {
  try {
    const expectedSecret = process.env.MATURITY_PROCESS_SECRET;
    const authorizationHeader = request.headers.get("authorization");

    if (!expectedSecret) {
      return NextResponse.json(
        {
          success: false,
          error: "MATURITY_PROCESS_SECRET is missing.",
        },
        { status: 500 }
      );
    }

    if (authorizationHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized request.",
        },
        { status: 401 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing.");
    }

    if (!serviceRoleKey) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing.");
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: depositData, error: depositError } = await supabaseAdmin
      .from("deposit_requests")
      .select(
        `
          id,
          user_id,
          amount,
          expected_profit,
          transaction_reference,
          maturity_status,
          profit_released_at,
          maturity_whatsapp_sent_at
        `
      )
      .eq("status", "approved")
      .eq("maturity_status", "matured")
      .not("profit_released_at", "is", null)
      .is("maturity_whatsapp_sent_at", null)
      .order("profit_released_at", { ascending: true })
      .limit(100);

    if (depositError) {
      throw new Error(depositError.message);
    }

    const deposits = (depositData || []) as MaturedDeposit[];

    if (deposits.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No new matured deposits require WhatsApp notifications.",
        summary: {
          found: 0,
          sent: 0,
          skipped: 0,
          failed: 0,
        },
        results: [],
      });
    }

    let sentCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    const results: Array<{
      depositId: string;
      userId: string;
      status: "sent" | "skipped" | "failed";
      reason?: string;
      phone?: string;
    }> = [];

    for (const deposit of deposits) {
      try {
        const { data: profileData, error: profileError } = await supabaseAdmin
          .from("profiles")
          .select(
            `
              id,
              full_name,
              phone,
              role,
              status,
              whatsapp_notifications_enabled,
              whatsapp_notifications_opt_in
            `
          )
          .eq("id", deposit.user_id)
          .single();

        if (profileError || !profileData) {
          failedCount += 1;

          results.push({
            depositId: deposit.id,
            userId: deposit.user_id,
            status: "failed",
            reason: profileError?.message || "Member profile was not found.",
          });

          continue;
        }

        const profile = profileData as MemberProfile;

        if (!canReceiveWhatsApp(profile)) {
          skippedCount += 1;

          results.push({
            depositId: deposit.id,
            userId: deposit.user_id,
            status: "skipped",
            reason:
              "Member has no valid phone number or has not enabled WhatsApp notifications.",
          });

          continue;
        }

        const profit = Number(deposit.expected_profit || 0);
        const depositAmount = Number(deposit.amount || 0);

        const referenceText = deposit.transaction_reference
          ? `\nReference: ${deposit.transaction_reference}`
          : "";

        const whatsappMessage = `KwachaRise: Your investment has matured! 🎉

Profit available: K${profit.toFixed(2)}
Deposit amount: K${depositAmount.toFixed(2)}${referenceText}

Your matured profit is now ready to withdraw.`;

        await sendWhatsAppMessage({
          to: profile.phone || "",
          message: whatsappMessage,
        });

        const { error: updateError } = await supabaseAdmin
          .from("deposit_requests")
          .update({
            maturity_whatsapp_sent_at: new Date().toISOString(),
          })
          .eq("id", deposit.id)
          .is("maturity_whatsapp_sent_at", null);

        if (updateError) {
          throw new Error(
            `WhatsApp was sent, but the notification timestamp could not be saved: ${updateError.message}`
          );
        }

        sentCount += 1;

        results.push({
          depositId: deposit.id,
          userId: deposit.user_id,
          status: "sent",
          phone: profile.phone || undefined,
        });
      } catch (depositProcessingError) {
        failedCount += 1;

        results.push({
          depositId: deposit.id,
          userId: deposit.user_id,
          status: "failed",
          reason:
            depositProcessingError instanceof Error
              ? depositProcessingError.message
              : "Unknown maturity notification error.",
        });
      }
    }

    return NextResponse.json({
      success: failedCount === 0,
      message: "Maturity WhatsApp notification processing completed.",
      summary: {
        found: deposits.length,
        sent: sentCount,
        skipped: skippedCount,
        failed: failedCount,
      },
      results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process maturity WhatsApp notifications.",
      },
      { status: 500 }
    );
  }
}