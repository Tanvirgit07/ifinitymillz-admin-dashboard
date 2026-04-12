/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Eye, Pencil, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import CampaignDetailsModal from "@/components/Dialogs/CampaignsModal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

type StatusType = "Draft" | "Active" | "Ended" | "Closed";

interface Campaign {
  _id: string;
  prizeImage: string;
  title: string;
  packages?: {
    name: string;
    ticketQuantity: number;
    price: number;
    _id: string;
  }[];
  totalTickets: number;
  soldTickets?: number;
  startDate: string;
  endDate: string;
  drawDate: string;
  status: StatusType;
}

const PAGE_SIZE = 7;

// Fallback image component using div when next/image isn't available
function PrizeImage({ alt }: { alt: string }) {
  return (
    <div className="w-9 h-9 rounded-lg bg-[#2a2a2a] border border-[#3a3a3a] flex items-center justify-center overflow-hidden flex-shrink-0">
      <div className="w-full h-full bg-gradient-to-br from-[#3a3020] to-[#1a1a1a] flex items-center justify-center">
        <span className="text-[#c9a84c] text-[10px] font-bold">⌚</span>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: StatusType }) {
  if (status === "Draft") {
    return (
      <Badge className="bg-[#2a2a2a] hover:bg-[#2a2a2a] text-[#c9a84c] text-xs font-semibold px-3 py-1 rounded-full border border-[#4a3a20] cursor-default">
        Draft
      </Badge>
    );
  }
  if (status === "Active") {
    return (
      <Badge className="bg-[#1a3a2a] hover:bg-[#1a3a2a] text-[#3dba6f] text-xs font-semibold px-3 py-1 rounded-full border border-[#2a5a3a] cursor-default">
        Active
      </Badge>
    );
  }
  return (
    <Badge className="bg-[#2a2a2a] hover:bg-[#2a2a2a] text-[#888888] text-xs font-semibold px-3 py-1 rounded-full border border-[#3a3a3a] cursor-default">
      {status}
    </Badge>
  );
}

function CampaignsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const session = useSession();
  const TOKEN = session?.data?.user?.accessToken;
  const queryClient = useQueryClient();

  const getPageNumbers = () => {
    const pages: number[] = [];
    for (let i = 1; i <= Math.min(totalPages, 3); i++) pages.push(i);
    return pages;
  };

  const { data: campaignData } = useQuery({
    queryKey: ["campaigns", currentPage],
    enabled: !!TOKEN,
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/campaigns?page=${currentPage}&limit=${PAGE_SIZE}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${TOKEN}`,
          },
        },
      );
      const json = await res.json();
      if (!res.ok || !json?.status) {
        throw new Error(json?.message || "Failed to fetch campaigns");
      }
      return json?.data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({
      campaignId,
      status,
    }: {
      campaignId: string;
      status: "Active" | "Ended";
    }) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/campaigns/${campaignId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${TOKEN}`,
          },
          body: JSON.stringify({ status }),
        },
      );
      const json = await res.json();
      if (!res.ok || !json?.status) {
        throw new Error(json?.message || "Failed to update campaign status");
      }
      return json?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });

  const campaigns: Campaign[] = campaignData?.campaigns ?? [];
  const totalPages = Math.max(
    1,
    Number(campaignData?.paginationInfo?.totalPages || 1),
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-GB");
  };

  return (
    <div className="min-h-screen">
      <div className="">
        {/* Title Row */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-white text-[24px] font-bold leading-[120%]">
            Campaigns
          </h1>
          <Link href="/campaigns/add-campaigns">
            <button className="flex items-center gap-2 bg-[#e8b84b] hover:bg-[#d4a73e] text-[#111111] font-semibold text-sm px-5 py-2.5 rounded-full transition-colors">
              <Plus size={16} strokeWidth={2.5} />
              Add Campaign
            </button>
          </Link>
        </div>

        {/* Table Container */}
        <div className="rounded-xl overflow-hidden border border-[#2a2a2a]">
          <Table>
            {/* Header */}
            <TableHeader>
              <TableRow className="bg-[#e8b84b] hover:bg-[#e8b84b] border-0">
                {[
                  "Prize Title",
                  "Ticket Price",
                  "Total Tickets",
                  "Start Date",
                  "End Date",
                  "Draw Date",
                  "Status",
                  "Actions",
                  "Winner",
                ].map((col) => (
                  <TableHead
                    key={col}
                    className="text-[#1F1F1F] text-base text-center py-4 font-medium whitespace-nowrap"
                  >
                    {col}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            {/* Body */}
            <TableBody>
              {campaigns.map((campaign, index) => (
                <TableRow
                  key={campaign._id}
                  className={`border-b border-[#222222] hover:bg-[#1e1e1e] transition-colors ${
                    index % 2 === 0 ? "bg-[#161616]" : "bg-[#131313]"
                  }`}
                >
                  {/* Prize Title */}
                  <TableCell className="py-4 text-center">
                    <div className="flex items-center gap-3 justify-start">
                      <PrizeImage alt={campaign.title} />
                      <span className="text-[#C9C9C9] text-base font-medium whitespace-nowrap">
                        {campaign.title}
                      </span>
                    </div>
                  </TableCell>

                  {/* Ticket Price */}
                  <TableCell className="text-[#aaaaaa] text-base text-center py-4 whitespace-nowrap">
                    {campaign.packages?.[0]?.price
                      ? `$${campaign.packages[0].price}`
                      : "-"}
                  </TableCell>

                  {/* Total Tickets */}
                  <TableCell className="text-[#aaaaaa] text-base text-center py-4">
                    {campaign.totalTickets}
                  </TableCell>

                  {/* Start Date */}
                  <TableCell className="text-[#aaaaaa] text-base text-center py-4 whitespace-nowrap">
                    {formatDate(campaign.startDate)}
                  </TableCell>

                  {/* End Date */}
                  <TableCell className="text-[#aaaaaa] text-base text-center py-4 whitespace-nowrap">
                    {formatDate(campaign.endDate)}
                  </TableCell>

                  {/* Draw Date */}
                  <TableCell className="text-[#aaaaaa] text-base text-center py-4 whitespace-nowrap">
                    {formatDate(campaign.drawDate)}
                  </TableCell>

                  {/* Status */}
                  <TableCell className="text-center py-4">
                    <div className="flex flex-col items-center gap-1.5">
                      <StatusBadge status={campaign.status} />
                      {(campaign.status === "Draft" ||
                        campaign.status === "Active") && (
                        <button
                          onClick={() =>
                            updateStatus.mutate({
                              campaignId: campaign._id,
                              status:
                                campaign.status === "Draft"
                                  ? "Active"
                                  : "Ended",
                            })
                          }
                          disabled={updateStatus.isPending}
                          className="text-[10px] font-semibold px-2.5 py-1 rounded-full border border-[#4a3a20] bg-[#2a2010] text-[#c9a84c] hover:bg-[#3a2a10] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {campaign.status === "Draft"
                            ? "Set Active"
                            : "Set Ended"}
                        </button>
                      )}
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-center py-4">
                    <div className="flex items-center justify-center gap-2">
                      {/* View */}
                      {/* <button
                        className="w-8 h-8 rounded-md bg-[#2a2010] border border-[#4a3a20] flex items-center justify-center hover:bg-[#3a2a10] transition-colors group"
                        title="View"
                      >
                        <Eye
                          size={15}
                          className="text-[#c9a84c] group-hover:text-[#e8b84b]"
                        />
                      </button> */}
                      <CampaignDetailsModal />

                      {/* Edit */}
                      <Link href={`campaigns/edit-campaigns/${campaign?._id}`}>
                        <button
                          className="w-8 h-8 rounded-md bg-[#2a2010] border border-[#4a3a20] flex items-center justify-center hover:bg-[#3a2a10] transition-colors group"
                          title="Edit"
                        >
                          <Pencil
                            size={14}
                            className="text-[#c9a84c] group-hover:text-[#e8b84b]"
                          />
                        </button>
                      </Link>
                    </div>
                  </TableCell>

                  {/* Winner */}
                  <TableCell className="text-center py-4">
                    <Link href={`/campaigns/genarate/${campaign?._id}`}>
                      <button className="bg-[#3dba6f] hover:bg-[#34a561] text-white text-xs font-semibold px-4 py-1.5 rounded-full transition-colors whitespace-nowrap">
                        Generate
                      </button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex justify-end items-center gap-1 mt-5">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="w-9 h-9 rounded-md bg-[#1a1a1a] border-[#2e2e2e] text-[#888] hover:bg-[#252525] hover:text-white disabled:opacity-30"
          >
            <ChevronLeft size={14} />
          </Button>

          {getPageNumbers().map((page) => (
            <Button
              key={page}
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(page)}
              className={`w-9 h-9 rounded-md text-sm font-semibold border transition-colors ${
                currentPage === page
                  ? "bg-[#e8b84b] border-[#e8b84b] text-[#111111] hover:bg-[#d4a73e]"
                  : "bg-[#1a1a1a] border-[#2e2e2e] text-[#888] hover:bg-[#252525] hover:text-white"
              }`}
            >
              {page}
            </Button>
          ))}

          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="w-9 h-9 rounded-md bg-[#1a1a1a] border-[#2e2e2e] text-[#888] hover:bg-[#252525] hover:text-white disabled:opacity-30"
          >
            <ChevronRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CampaignsPage;
