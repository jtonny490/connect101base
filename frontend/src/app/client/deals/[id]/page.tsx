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

