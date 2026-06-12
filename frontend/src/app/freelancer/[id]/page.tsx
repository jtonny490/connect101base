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
 