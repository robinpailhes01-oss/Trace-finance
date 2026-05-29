import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import type { RecapPayload } from "@/lib/recap";

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function sign(n: number) {
  return n >= 0 ? `+${fmt(n)}` : fmt(n);
}

function buildEmailHtml(payload: RecapPayload): string {
  const { currentMonth: c, insights, periodLabel, type, account } = payload;
  const accountLabel = account === "pro" ? "Pro" : "Perso";
  const typeLabel = type === "weekly" ? "Récap Hebdo" : "Récap Mensuel";
  const balanceColor = c.balance >= 0 ? "#7B9B75" : "#C47A6B";
  const savingsColor = c.savingsRate >= 20 ? "#7B9B75" : c.savingsRate >= 10 ? "#E8C96B" : "#C47A6B";

  const categoryRows = c.topCategories
    .map(
      (cat) => `
      <tr>
        <td style="padding:6px 0;font-size:14px;color:#3D2F1F;">${cat.emoji} ${cat.label}</td>
        <td style="padding:6px 0;font-size:14px;color:#3D2F1F;text-align:right;font-weight:600;">${fmt(cat.amount)}</td>
        <td style="padding:6px 0;font-size:12px;color:#3D2F1F99;text-align:right;padding-left:12px;">${cat.pct}%</td>
      </tr>
      <tr>
        <td colspan="3" style="padding:2px 0 4px;">
          <div style="height:4px;background:#F5EBDD;border-radius:2px;">
            <div style="height:4px;background:#3D2F1F;border-radius:2px;width:${cat.pct}%;"></div>
          </div>
        </td>
      </tr>`,
    )
    .join("");

  const insightItems = insights
    .map(
      (ins) => `
      <li style="margin-bottom:12px;padding-left:8px;border-left:3px solid #E8C96B;font-size:14px;color:#3D2F1F;line-height:1.6;">
        ${ins}
      </li>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${typeLabel} Trace — ${periodLabel}</title>
</head>
<body style="margin:0;padding:0;background:#F5EBDD;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5EBDD;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;" cellpadding="0" cellspacing="0">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:22px;font-weight:700;color:#3D2F1F;letter-spacing:-0.5px;">Trace</span>
                    <span style="font-size:13px;color:#3D2F1F99;margin-left:8px;">${accountLabel}</span>
                  </td>
                  <td align="right">
                    <span style="font-size:12px;font-weight:600;color:#F5EBDD;background:#3D2F1F;padding:4px 12px;border-radius:20px;">${typeLabel}</span>
                  </td>
                </tr>
              </table>
              <p style="margin:8px 0 0;font-size:16px;color:#3D2F1F;font-weight:500;">${periodLabel}</p>
            </td>
          </tr>

          <!-- Stats cards -->
          <tr>
            <td style="padding-bottom:16px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:16px;overflow:hidden;background:rgba(255,255,255,0.65);border:1px solid rgba(61,47,31,0.1);">
                <tr>
                  <td width="33%" style="padding:20px 16px;text-align:center;border-right:1px solid rgba(61,47,31,0.08);">
                    <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.8px;color:#3D2F1F99;margin-bottom:6px;">Revenus</div>
                    <div style="font-size:18px;font-weight:700;color:#7B9B75;">${fmt(c.income)}</div>
                  </td>
                  <td width="33%" style="padding:20px 16px;text-align:center;border-right:1px solid rgba(61,47,31,0.08);">
                    <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.8px;color:#3D2F1F99;margin-bottom:6px;">Dépenses</div>
                    <div style="font-size:18px;font-weight:700;color:#C47A6B;">${fmt(c.expense)}</div>
                  </td>
                  <td width="33%" style="padding:20px 16px;text-align:center;">
                    <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.8px;color:#3D2F1F99;margin-bottom:6px;">Solde</div>
                    <div style="font-size:18px;font-weight:700;color:${balanceColor};">${sign(c.balance)}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Savings rate + KPIs -->
          <tr>
            <td style="padding-bottom:16px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="48%" style="padding:16px;background:rgba(255,255,255,0.65);border:1px solid rgba(61,47,31,0.1);border-radius:14px;text-align:center;">
                    <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.8px;color:#3D2F1F99;margin-bottom:6px;">Taux d'épargne</div>
                    <div style="font-size:28px;font-weight:700;color:${savingsColor};">${Math.round(c.savingsRate)}%</div>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="padding:16px;background:rgba(255,255,255,0.65);border:1px solid rgba(61,47,31,0.1);border-radius:14px;text-align:center;">
                    <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.8px;color:#3D2F1F99;margin-bottom:6px;">Moy. / jour</div>
                    <div style="font-size:28px;font-weight:700;color:#3D2F1F;">${fmt(Math.round(c.avgDaily))}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${
            c.topCategories.length > 0
              ? `
          <!-- Top categories -->
          <tr>
            <td style="padding-bottom:16px;">
              <div style="background:rgba(255,255,255,0.65);border:1px solid rgba(61,47,31,0.1);border-radius:14px;padding:20px;">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.8px;color:#3D2F1F99;margin-bottom:16px;">Top dépenses</div>
                <table width="100%" cellpadding="0" cellspacing="0">
                  ${categoryRows}
                </table>
              </div>
            </td>
          </tr>`
              : ""
          }

          ${
            insights.length > 0
              ? `
          <!-- Insights -->
          <tr>
            <td style="padding-bottom:24px;">
              <div style="background:rgba(255,255,255,0.65);border:1px solid rgba(61,47,31,0.1);border-radius:14px;padding:20px;">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.8px;color:#3D2F1F99;margin-bottom:16px;">💡 Prises de conscience</div>
                <ul style="margin:0;padding:0;list-style:none;">
                  ${insightItems}
                </ul>
              </div>
            </td>
          </tr>`
              : ""
          }

          ${
            c.biggestTx
              ? `
          <!-- Biggest tx -->
          <tr>
            <td style="padding-bottom:24px;">
              <div style="background:rgba(196,122,107,0.08);border:1px solid rgba(196,122,107,0.2);border-radius:14px;padding:16px 20px;display:flex;align-items:center;">
                <span style="font-size:13px;color:#3D2F1F;">Plus grosse dépense : <strong>${c.biggestTx.emoji} ${c.biggestTx.label}</strong> — <strong>${fmt(c.biggestTx.amount)}</strong></span>
              </div>
            </td>
          </tr>`
              : ""
          }

          <!-- Footer -->
          <tr>
            <td style="padding-top:8px;text-align:center;">
              <p style="font-size:12px;color:#3D2F1F66;margin:0 0 4px;">
                Envoyé par <strong style="color:#3D2F1F99;">Trace Finance</strong>
              </p>
              <p style="font-size:11px;color:#3D2F1F44;margin:0;">
                Les données ne quittent jamais votre appareil — ce récap a été généré localement.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, payload } = body as { email: string; payload: RecapPayload };

    if (!email || !payload) {
      return NextResponse.json({ error: "Missing email or payload" }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Email not configured (missing RESEND_API_KEY)" }, { status: 503 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const typeLabel = payload.type === "weekly" ? "Récap Hebdo" : "Récap Mensuel";
    const accountLabel = payload.account === "pro" ? "Pro" : "Perso";
    const subject = `${typeLabel} Trace ${accountLabel} — ${payload.periodLabel}`;

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "Trace Finance <onboarding@resend.dev>",
      to: email,
      subject,
      html: buildEmailHtml(payload),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
