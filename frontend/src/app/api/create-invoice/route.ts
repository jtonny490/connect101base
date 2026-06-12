import { NextResponse } from "next/server";
import { createHash } from "crypto";

export async function POST(request: Request) {
  try {
    const { amount, memo } = await request.json();

    // Generate real SHA-256 preimage from deal data + timestamp
    const timestamp = Date.now();
    const preimage = createHash("sha256")
      .update(`${memo}:${amount}:${timestamp}`)
      .digest("hex");

    const apiKey = process.env.LNBITS_API_KEY;

    if (!apiKey) {
      // Honest mock — real hash, fake invoice
      const mockInvoice = `lnbc${amount}n1demo${preimage.substring(0, 20)}`;
      return NextResponse.json({
        payment_request: mockInvoice,
        checking_id: `mock_${preimage.substring(0, 12)}`,
        preimage,
        timestamp,
      });
    }

    const response = await fetch("https://lnbits.com/api/v1/payments", {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        out: false,
        amount: parseInt(amount) || 1000,
        memo: memo || "DealLock Escrow",
        unit: "sat",
      }),
    });

    if (!response.ok) throw new Error("LNbits request failed");

    const data = await response.json();
    return NextResponse.json({
      payment_request: data.payment_request,
      checking_id: data.checking_id,
      preimage,
      timestamp,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 },
    );
  }
}
