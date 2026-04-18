"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Eye, X } from "lucide-react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

interface Package {
  name: string;
  ticketQuantity: number;
  price: number;
  _id: string;
}

interface Winner {
  _id: string;
  name: string;
  email: string;
}

interface CampaignStats {
  participants: number;
  totalEntries: number;
  revenue: number;
  remainingTickets: number;
}

interface CampaignDetails {
  _id: string;
  title: string;
  description: string;
  prizeImage: string;
  totalTickets: number;
  soldTickets: number;
  remainingTickets: number;
  maxFreeEntries?: number;
  packages: Package[];
  startDate: string;
  endDate: string;
  drawDate: string;
  status: "Draft" | "Active" | "Ended" | "Closed";
  isFeatured?: boolean;
  winnerId?: Winner | null;
  winningTicket?: string | null;
  isWinnerGenerated?: boolean;
  isResultPublished?: boolean;
  stats: CampaignStats;
}

function PrizeImagePlaceholder() {
  return (
    <div
      className="rounded-xl overflow-hidden flex items-center justify-center"
      style={{
        width: 190,
        height: 140,
        background: "linear-gradient(135deg, #2a2010 0%, #1a1400 100%)",
        border: "1px solid #3a3020",
      }}
    >
      <div className="flex flex-col items-center gap-1">
        <div
          className="rounded-2xl flex items-center justify-center"
          style={{
            width: 60,
            height: 100,
            background:
              "linear-gradient(160deg, #c0c0c0 0%, #888 50%, #aaa 100%)",
            border: "2px solid #666",
            position: "relative",
          }}
        >
          <div
            style={{
              width: 48,
              height: 78,
              background: "#111",
              borderRadius: 10,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 8,
              left: 4,
              width: 18,
              height: 28,
              background: "#555",
              borderRadius: 6,
            }}
          />
        </div>
      </div>
    </div>
  );
}

interface CampaignDetailsModalProps {
  id?: string;
}

export function CampaignDetailsModal({ id }: CampaignDetailsModalProps) {
  const [open, setOpen] = useState(false);
  const session = useSession();
  const TOKEN = session?.data?.user?.accessToken;

  const { data: campaign, isLoading, isError, error } = useQuery<CampaignDetails>({
    queryKey: ["single-campaign", id],
    enabled: !!id && !!TOKEN && open,
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/campaigns/${id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${TOKEN}`,
          },
        },
      );
      const json = await res.json();
      if (!res.ok || !json?.status) {
        throw new Error(json?.message || "Failed to fetch campaign");
      }
      return json?.data;
    },
  });

  const ticketPrice = campaign?.packages?.[0]?.price ?? 0;
  const totalTickets = campaign?.totalTickets ?? 0;
  const soldTickets = campaign?.soldTickets ?? 0;
  const remainingTickets =
    campaign?.remainingTickets ?? Math.max(0, totalTickets - soldTickets);
  const soldPercent = totalTickets
    ? Math.round((soldTickets / totalTickets) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="w-8 h-8 rounded-md bg-[#2a2010] border border-[#4a3a20] flex items-center justify-center hover:bg-[#3a2a10] transition-colors group"
          title="View"
        >
          <Eye
            size={15}
            className="text-[#c9a84c] group-hover:text-[#e8b84b]"
          />
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-[620px] p-0 gap-0 border border-[#2a2a2a] rounded-2xl overflow-hidden bg-[#1c1c1c] shadow-2xl [&>button.absolute]:hidden">
        {/* Header */}
        <DialogHeader className="px-7 pt-7 pb-5 border-b border-[#2a2a2a] flex flex-row items-start justify-between">
          <div>
            <DialogTitle className="text-white text-xl font-bold leading-none mb-3">
              Campaign Details
            </DialogTitle>
            <p className="text-[#c9a84c] text-sm font-semibold leading-none">
              {isLoading ? "Loading..." : campaign?.title || "-"}
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-[#666] hover:text-white transition-colors mt-1 flex-shrink-0"
          >
            <X size={20} />
          </button>
        </DialogHeader>

        {/* Body */}
        <div className="px-7 py-6 flex flex-col gap-6">
          {isLoading ? (
            <p className="text-[#aaaaaa] text-sm text-center py-10">
              Loading campaign details...
            </p>
          ) : isError ? (
            <p className="text-[#e05555] text-sm text-center py-10">
              {(error as Error)?.message || "Failed to load campaign"}
            </p>
          ) : campaign ? (
            <>
              {/* Description */}
              <p className="text-[#aaaaaa] text-sm leading-[170%]">
                {campaign.description}
              </p>

              {/* Prize Image + Stats Row */}
              <div className="flex gap-8 items-start">
                {/* Left — Image + ticket info */}
                <div className="flex flex-col gap-4">
                  <p className="text-[#888] text-sm font-medium">
                    Prize Image<span className="text-[#e05555]">*</span>
                  </p>

                  {campaign.prizeImage ? (
                    <div className="rounded-xl overflow-hidden w-[190px] h-[140px]">
                      <Image
                        width={400}
                        height={300}
                        src={campaign.prizeImage}
                        alt="Prize"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <PrizeImagePlaceholder />
                  )}

                  {/* Ticket details */}
                  <div className="flex flex-col gap-2 mt-1">
                    {[
                      ["Ticket Price", `$${ticketPrice}`],
                      ["Total Ticket", totalTickets],
                      ["Total Ticket sold", soldTickets],
                      ["Total Ticket remaining", remainingTickets],
                    ].map(([label, value]) => (
                      <p
                        key={label as string}
                        className="text-[#C9C9C9] text-sm leading-[160%]"
                      >
                        <span className="text-[#888]">{label} : </span>
                        {value}
                      </p>
                    ))}
                  </div>

                  {/* Status */}
                  <p className="text-[#C9C9C9] text-sm mt-1">
                    <span className="text-[#888]">Status : </span>
                    {campaign.status}
                  </p>
                </div>

                {/* Divider */}
                <div className="w-px self-stretch bg-[#2a2a2a]" />

                {/* Right — Entry Statistics */}
                <div className="flex-1 flex flex-col gap-4 pt-8">
                  <h3 className="text-white text-lg font-bold leading-none">
                    Entry Statistics
                  </h3>

                  <div className="flex flex-col gap-3 mt-1">
                    {[
                      ["Participants", campaign.stats?.participants ?? 0],
                      ["Total Entries", campaign.stats?.totalEntries ?? 0],
                      [
                        "Revenue",
                        `$${(campaign.stats?.revenue ?? 0).toLocaleString()}`,
                      ],
                    ].map(([label, value]) => (
                      <p
                        key={label as string}
                        className="text-[#C9C9C9] text-sm leading-[160%]"
                      >
                        <span className="text-[#888]">{label} : </span>
                        {value}
                      </p>
                    ))}
                  </div>

                  {/* Winner info */}
                  {campaign.winnerId && (
                    <div className="flex flex-col gap-1 mt-1">
                      <p className="text-[#C9C9C9] text-sm leading-[160%]">
                        <span className="text-[#888]">Winner : </span>
                        {campaign.winnerId.name}
                      </p>
                      <p className="text-[#C9C9C9] text-sm leading-[160%]">
                        <span className="text-[#888]">Winning Ticket : </span>
                        {campaign.winningTicket || "-"}
                      </p>
                    </div>
                  )}

                  {/* Visual revenue bar */}
                  <div className="mt-4 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[#555] text-xs">Tickets Sold</span>
                      <span className="text-[#c9a84c] text-xs font-semibold">
                        {soldPercent}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[#2a2a2a] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${soldPercent}%`,
                          background: "linear-gradient(90deg, #8a6820, #e8b84b)",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CampaignDetailsModal;
