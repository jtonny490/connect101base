"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBackendUrl } from "@/lib/backend";

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

export default function CreateDeal() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [origin, setOrigin] = useState("Direct");
  const [provider, setProvider] = useState("lightning");
  const [currency, setCurrency] = useState("KES");
  const [milestones, setMilestones] = useState<
    Array<{ title: string; amount: string }>
  >([{ title: "Full project milestone", amount: "" }]);
  const [payInSats, setPayInSats] = useState(false);

  const [paymentRequest, setPaymentRequest] = useState("");
  const [paymentInstructions, setPaymentInstructions] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [dealId, setDealId] = useState("");
  const [clientLink, setClientLink] = useState("");
  const [freelancerLink, setFreelancerLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleCreate = async () => {
    if (loading) return;
    if (!title || !amount) return;
    setLoading(true);

    try {
      const backendBase = getBackendUrl();

      const milestoneTotal = milestones.reduce(
        (s, m) => s + (Number(m.amount) || 0),
        0,
      );
      const finalAmount =
        milestoneTotal > 0 ? milestoneTotal : Number(amount || 0);
      const milestonesPayload = milestones.map((m, idx) => ({
        title: m.title || `Milestone ${idx + 1}`,
        amountSats: Number(m.amount) || 0,
      }));

      const dealResponse = await fetch(`${backendBase}/api/deals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          origin,
          amountSats: finalAmount,
          description: "",
          milestones: milestonesPayload,
          payInSats,
        }),
      });

      const deal = await dealResponse.json();
      if (!deal?.id) throw new Error("Failed to create deal");

      const invoiceResponse = await fetch(
        `${backendBase}/api/deals/${deal.id}/invoice`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider, currency }),
        },
      );

      const invoice = await invoiceResponse.json();

      if (!invoice?.id) throw new Error("Failed to generate invoice");
      if (invoice?.invoice) {
        setPaymentRequest(invoice.invoice);
      }
      if (invoice?.instructions) {
        setPaymentInstructions(invoice.instructions);
      }

      const originUrl =
        typeof window !== "undefined"
          ? window.location.origin
          : "http://localhost:3000";
      const clientUrl = `${originUrl}/client/deals/${deal.id}`;
      const freelancerUrl = `${originUrl}/freelancer/${deal.id}`;

      setPaymentRequest(invoice.invoice || "");
      setPaymentId(invoice.id);
      setDealId(deal.id);
      setClientLink(clientUrl);
      setFreelancerLink(freelancerUrl);
      setDone(true);
    } catch (err) {
      console.error("Error connecting to backend", err);
    } finally {
      setLoading(false);
    }
  };


