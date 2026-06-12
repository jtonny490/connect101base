"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getBackendUrl } from "@/lib/backend";

interface DealResponse {
  deal: {
    id: string;
    title: string;
    origin?: string;
    amountSats: number;
    payInSats?: boolean;
    status: string;
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

export default function FreelancerDashboard() {
  const params = useParams();
  const dealId = params.id as string;
  const [dealData, setDealData] = useState<DealResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
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
  const [bountyPreviewUrl, setBountyPreviewUrl] = useState("");
  const [bountyNotes, setBountyNotes] = useState("");
  const [bountySubmissions, setBountySubmissions] = useState<any[]>([]);
  const [bountyMessage, setBountyMessage] = useState("");
  const backendBase = getBackendUrl();

  useEffect(() => {
    if (!dealId) return;
    setLoading(true);
    fetch(`${backendBase}/api/deals/${dealId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Deal not found");
        return res.json();
      })
      .then(async (payload: DealResponse) => {
        setDealData(payload);
        setError("");
        const nextMilestone = payload.milestones?.[0];
        if (nextMilestone) {
          fetch(`${backendBase}/api/milestones/${nextMilestone.id}/submissions`)
            .then((res) => (res.ok ? res.json() : null))
            .then((body) => {
              if (body?.submissions) {
                setSubmissions(body.submissions);
              } else {
                setSubmissions([]);
              }
            })
            .catch(() => setSubmissions([]));

          // fetch bounty if opened
          try {
            const bRes = await fetch(`${backendBase}/api/bounties`);
            if (bRes.ok) {
              const bList = await bRes.json();
              const found = bList.find(
                (b: any) =>
                  b.dealId === payload.deal.id &&
                  b.milestoneId === nextMilestone.id &&
                  b.status === "open",
              );
              if (found) {
                setBounty(found);
                const bsRes = await fetch(
                  `${backendBase}/api/bounties/${found.id}/submissions`,
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
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Unable to load deal.");
      })
      .finally(() => setLoading(false));
  }, [dealId, backendBase]);

  // Poll the deal so milestone/payment changes show up without manual refresh
  useEffect(() => {
    if (!dealId) return;
    const iv = setInterval(() => {
      fetch(`${backendBase}/api/deals/${dealId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((payload: DealResponse | null) => {
          if (!payload) return;
          setDealData(payload);
          const nextMilestone = payload.milestones?.[0];
          if (nextMilestone) {
            fetch(
              `${backendBase}/api/milestones/${nextMilestone.id}/submissions`,
            )
              .then((res) => (res.ok ? res.json() : null))
              .then((body) => {
                if (body?.submissions) setSubmissions(body.submissions);
                else setSubmissions([]);
              })
              .catch(() => setSubmissions([]));
          } else {
            setSubmissions([]);
          }
        })
        .catch(() => {});
    }, 5000);
    return () => clearInterval(iv);
  }, [dealId, backendBase]);

  const handleSubmitBounty = async (bountyId: string) => {
    if (!bountyPreviewUrl.trim()) {
      setBountyMessage("Preview URL is required.");
      return;
    }
    setBountyMessage("Submitting...");
    try {
      const res = await fetch(
        `${backendBase}/api/bounties/${bountyId}/submissions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            previewUrl: bountyPreviewUrl.trim(),
            notes: bountyNotes.trim(),
          }),
        },
      );
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body?.error || "Submission failed");
      }
      setBountyPreviewUrl("");
      setBountyNotes("");
      setBountyMessage("Submission sent.");
      const bsRes = await fetch(
        `${backendBase}/api/bounties/${bountyId}/submissions`,
      );
      if (bsRes.ok) {
        const bsBody = await bsRes.json();
        setBountySubmissions(bsBody.submissions || []);
      }
    } catch (err) {
      console.error(err);
      setBountyMessage((err as Error).message || "Submission failed");
    }
  };

  const milestone = useMemo(
    () => dealData?.milestones?.[0] ?? null,
    [dealData],
  );
  const canSubmit = Boolean(milestone && milestone.status === "funded");
  const submissionPending = Boolean(
    milestone && milestone.status === "submitted",
  );
  const approved =
    milestone?.status === "approved" || milestone?.status === "released";

  const handleSubmit = async () => {
    if (!milestone) return;
    if (!previewUrl.trim()) {
      setError("Please enter a deliverable URL.");
      return;
    }
    if (!previewUrl.trim().startsWith("https://")) {
      setError("URL must start with https://");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        `${backendBase}/api/milestones/${milestone.id}/submissions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ previewUrl: previewUrl.trim(), notes }),
        },
      );
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body?.error || "Submission failed");
      }
      await fetch(`${backendBase}/api/deals/${dealId}`)
        .then((res) => res.json())
        .then((payload: DealResponse) => setDealData(payload));
      setPreviewUrl("");
      setNotes("");
    } catch (err) {
      console.error(err);
      setError((err as Error).message || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

 