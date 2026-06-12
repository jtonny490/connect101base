"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getBackendUrl } from "@/lib/backend";

interface DealPayload {
  deal: {
    id: string;
    title: string;
    description?: string;
    origin?: string;
    amountSats: number;
    localCurrency?: string;
    status: string;
    clientToken: string;
    freelancerToken: string;
    createdAt: string;
    updatedAt: string;
  };
  milestones: Array<{
    id: string;
    title: string;
    amountSats: number;
    status: string;
    position: number;
  }>;
  payments: Array<{
    id: string;
    provider: string;
    status: string;
    invoice?: string;
    instructions?: string;
    amountSats: number;
    amountLocal: number;
    localCurrency: string;
  }>;
}

export default function ClientDealPage() {
  const params = useParams();
  const dealId = params.id as string;
  const [data, setData] = useState<DealPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [error, setError] = useState("");
  const [bountyOpen, setBountyOpen] = useState(false);
  const [bountyTitle, setBountyTitle] = useState("Fix milestone deliverable");
  const [bountyAmount, setBountyAmount] = useState("0");
  const [bountyDescription, setBountyDescription] = useState(
    "Resolve issues from rejected milestone delivery.",
  );
  const [submissions, setSubmissions] = useState<
    Array<{
      id: string;
      milestoneId: string;
      previewUrl: string;
      notes?: string;
      status: string;
      createdAt: string;
    }>
  >([]);
  const [bounty, setBounty] = useState<any | null>(null);
  const [bountySubmissions, setBountySubmissions] = useState<any[]>([]);
  const [bountyPreviewUrl, setBountyPreviewUrl] = useState("");
  const [bountyNotes, setBountyNotes] = useState("");
  const [bountyLoading, setBountyLoading] = useState(false);
  const [bountyMessage, setBountyMessage] = useState("");
  const [sandboxUrl, setSandboxUrl] = useState<string | null>(null);
  const [backendUrl] = useState(getBackendUrl());

  const refreshDeal = async () => {
    if (!dealId) return;
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/deals/${dealId}`);
      if (!res.ok) throw new Error("Deal not found");
      const payload: DealPayload = await res.json();
      setData(payload);
      setError("");
      if (payload.milestones.length > 0) {
        const firstMilestoneId = payload.milestones[0].id;
        const submissionsRes = await fetch(
          `${backendUrl}/api/milestones/${firstMilestoneId}/submissions`,
        );
        if (submissionsRes.ok) {
          const submissionBody = await submissionsRes.json();
          setSubmissions(submissionBody.submissions || []);
        } else {
          setSubmissions([]);
        }
        // fetch any open bounty for this deal+milestone
        try {
          const bRes = await fetch(`${backendUrl}/api/bounties`);
          if (bRes.ok) {
            const bList = await bRes.json();
            const found = bList.find(
              (b: any) =>
                b.dealId === payload.deal.id &&
                b.milestoneId === firstMilestoneId &&
                b.status === "open",
            );
            if (found) {
              setBounty(found);
              const bsRes = await fetch(
                `${backendUrl}/api/bounties/${found.id}/submissions`,
              );
              if (bsRes.ok) {
                const bsBody = await bsRes.json();
                setBountySubmissions(bsBody.submissions || []);
              } else {
                setBountySubmissions([]);
              }
            } else {
              setBounty(null);
              setBountySubmissions([]);
            }
          }
        } catch (err) {
          setBounty(null);
          setBountySubmissions([]);
        }
      } else {
        setSubmissions([]);
        setBounty(null);
        setBountySubmissions([]);
      }
    } catch (err) {
      console.error(err);
      setError("Unable to load deal.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshDeal();
  }, [dealId, backendUrl]);

  // Poll the deal occasionally so changes (funding, submissions) appear without refresh
  useEffect(() => {
    if (!dealId) return;
    const iv = setInterval(() => {
      refreshDeal();
    }, 5000);
    return () => clearInterval(iv);
  }, [dealId, backendUrl]);

  const handleCheckPayment = async () => {
    if (!latestPayment) return;
    setPaymentLoading(true);
    setPaymentMessage("Checking payment...");

    try {
      const response = await fetch(
        `${backendUrl}/api/payments/${latestPayment.id}/check`,
        {
          method: "POST",
        },
      );
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body?.error || "Payment verification failed");
      }
      const result = await response.json();
      setPaymentMessage(`Payment status: ${result.status}`);
      await refreshDeal();
    } catch (err) {
      console.error(err);
      setPaymentMessage((err as Error).message || "Unable to verify payment.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleAction = async (path: string, successMessage: string) => {
    if (!data) return;
    setActionLoading(true);
    setActionMessage("Processing…");
    try {
      const response = await fetch(`${backendUrl}${path}`, { method: "POST" });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body?.error || "Action failed");
      }
      setActionMessage(successMessage);
      await refreshDeal();
    } catch (err) {
      console.error(err);
      setActionMessage((err as Error).message || "Action failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveMilestone = async (milestoneId: string) => {
    await handleAction(
      `/api/milestones/${milestoneId}/approve`,
      "Milestone approved.",
    );
  };

  const handleRejectMilestone = async (milestoneId: string) => {
    await handleAction(
      `/api/milestones/${milestoneId}/reject`,
      "Milestone rejected. You can open a bounty from this milestone.",
    );
  };

  const handleReleaseFunds = async () => {
    if (!latestPayment) return;
    await handleAction(
      `/api/payments/${latestPayment.id}/release`,
      "Funds released.",
    );
  };

  const handleOpenBounty = async (milestoneId: string) => {
    if (!data) return;
    if (!bountyTitle.trim()) {
      setActionMessage("Bounty title is required.");
      return;
    }
    if (!Number(bountyAmount) || Number(bountyAmount) <= 0) {
      setActionMessage("Enter a valid bounty amount.");
      return;
    }
    setActionLoading(true);
    setActionMessage("Opening bounty…");

    try {
      const response = await fetch(
        `${backendUrl}/api/milestones/${milestoneId}/bounty`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: bountyTitle.trim(),
            description: bountyDescription.trim(),
            amountSats: Number(bountyAmount),
          }),
        },
      );
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body?.error || "Unable to open bounty");
      }
      setActionMessage("Bounty opened successfully.");
      await refreshDeal();
      setBountyOpen(false);
    } catch (err) {
      console.error(err);
      setActionMessage((err as Error).message || "Unable to open bounty.");
    } finally {
      setActionLoading(false);
    }
  };

