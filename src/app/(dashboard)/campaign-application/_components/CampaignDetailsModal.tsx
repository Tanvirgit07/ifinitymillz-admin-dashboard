"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X, CheckCircle, XCircle, FileText } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

type StatusType = "Pending" | "Approved" | "Paid" | "Rejected";

interface ApplicationDetail {
  _id: string;
  fullName: string;
  brandName: string;
  email: string;
  phone: string;
  country: string;
  socialMedia: string;
  audienceSize: string;
  campaignIdea: string;
  whyFeature: string;
  documentUrl: string;
  status: StatusType;
}

interface CampaignDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  onSuccess?: () => void;
}

function FieldGroup({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[#c9c9c9] text-sm font-medium">{label}</label>
      <div
        className="w-full px-4 py-2.5 rounded-lg text-[#aaaaaa] text-sm"
        style={{
          background: "#2a2a2a",
          border: "1px solid #3a3a3a",
          minHeight: "42px",
        }}
      >
        {value || "—"}
      </div>
    </div>
  );
}

function TextareaField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[#c9c9c9] text-sm font-medium">{label}</label>
      <div
        className="w-full px-4 py-3 rounded-lg text-[#aaaaaa] text-sm"
        style={{
          background: "#2a2a2a",
          border: "1px solid #3a3a3a",
          minHeight: "56px",
        }}
      >
        {value || "—"}
      </div>
    </div>
  );
}

export function CampaignDetailsModal({
  open,
  onOpenChange,
  applicationId,
  onSuccess,
}: CampaignDetailsModalProps) {
  const { data: session } = useSession();
  const TOKEN = session?.user?.accessToken;

  // ✅ GET single application
  const { data: appData, isLoading } = useQuery({
    queryKey: ["campaignApplication", applicationId],
    enabled: !!TOKEN && !!applicationId && open,
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/applications/${applicationId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${TOKEN}`,
          },
        }
      );
      const json = await res.json();
      return json.data as ApplicationDetail;
    },
  });

  // ✅ Status update mutation
  const updateMutation = useMutation({
    mutationFn: async (status: StatusType) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/applications/${applicationId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${TOKEN}`,
          },
          body: JSON.stringify({ status }),
        }
      );
      return res.json();
    },
    onSuccess: () => {
      onSuccess?.();
    },
  });

  // documentUrl থেকে file size বের করা সম্ভব না, তাই fixed label
  const isPdf = appData?.documentUrl?.endsWith(".pdf");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[640px] w-full p-0 gap-0 border-0 overflow-hidden [&>button]:hidden"
        style={{
          background: "#1c1c1c",
          borderRadius: "16px",
          border: "1px solid #2e2e2e",
          boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
        }}
      >
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between px-6 py-5 border-b border-[#2a2a2a]">
          <DialogTitle className="text-white text-lg font-bold">
            Campaign Details
          </DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="w-7 h-7 flex items-center justify-center rounded-full text-[#888] hover:text-white hover:bg-[#2e2e2e] transition-colors"
          >
            <X size={16} />
          </button>
        </DialogHeader>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-[#888] text-sm">Loading details...</p>
            </div>
          ) : appData ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <FieldGroup label="Full Name" value={appData.fullName} />
                <FieldGroup label="Brand Name" value={appData.brandName} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FieldGroup label="Email" value={appData.email} />
                <FieldGroup label="Phone" value={appData.phone} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FieldGroup label="Country" value={appData.country} />
                <FieldGroup label="Social media" value={appData.socialMedia} />
              </div>

              <FieldGroup label="Audience size" value={appData.audienceSize} />

              <TextareaField label="Campaign idea" value={appData.campaignIdea} />

              <TextareaField label="Why Features" value={appData.whyFeature} />

              {/* Document */}
              {appData.documentUrl && (
                <div className="flex flex-col gap-2">
                  <label className="text-[#c9c9c9] text-sm font-medium">
                    Documents
                  </label>
                  <div className="flex items-center gap-3">
                    <a
                      href={appData.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-1 group"
                    >
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center transition-opacity group-hover:opacity-80"
                        style={{ background: "#2272d9" }}
                      >
                        <FileText size={22} className="text-white" />
                      </div>
                      <span className="text-[#888] text-xs">
                        {isPdf ? "PDF" : "File"}
                      </span>
                    </a>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-[#555] text-sm text-center py-10">
              Failed to load application data.
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="grid grid-cols-2 border-t border-[#2a2a2a]">
          <button
            onClick={() => updateMutation.mutate("Rejected")}
            disabled={updateMutation.isPending}
            className="flex items-center justify-center gap-2 py-4 text-white text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "#e05555" }}
          >
            <XCircle size={16} />
            {updateMutation.isPending ? "Updating..." : "Reject"}
          </button>
          <button
            onClick={() => updateMutation.mutate("Approved")}
            disabled={updateMutation.isPending}
            className="flex items-center justify-center gap-2 py-4 text-white text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "#3dba6f" }}
          >
            <CheckCircle size={16} />
            {updateMutation.isPending ? "Updating..." : "Accept"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CampaignDetailsModal;