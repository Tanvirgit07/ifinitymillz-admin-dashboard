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
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useSession } from "next-auth/react";

type ResultType = "Publish" | "Published";

interface Winner {
  _id: string;
  title: string;
  prizeImage: string;
  winningTicket: string;
  winnerId: {
    _id: string;
    name: string;
    email: string;
  };
  drawDate: string;
  totalTickets: number;
  packages: { price: number }[];
  endDate: string;
  isResultPublished: boolean;
}

const PAGE_SIZE = 7;

function PrizeThumbnail({ image, title }: { image: string; title: string }) {
  return (
    <div
      className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #3a3020 0%, #1a1400 100%)",
        border: "1px solid #3a3020",
      }}
    >
      {image ? (
        <Image
          width={400}
          height={400}
          src={image}
          alt={title}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-[#c9a84c] text-sm">⌚</span>
      )}
    </div>
  );
}

function ResultButton({
  result,
  onClick,
  loading,
}: {
  result: ResultType;
  onClick: () => void;
  loading: boolean;
}) {
  if (result === "Published") {
    return (
      <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold bg-[#1a3a2a] text-[#3dba6f] border border-[#2a5a3a] cursor-default">
        Published
      </span>
    );
  }
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold bg-[#3dba6f] hover:bg-[#34a561] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? "Publishing..." : "Publish"}
    </button>
  );
}

function WinnersPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const session = useSession();
  const TOKEN = session?.data?.user?.accessToken;

  // ✅ GET API — campaigns with isWinnerGenerated=true
  const { data: winnersData, isLoading } = useQuery({
    queryKey: ["winners"],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/campaigns?isWinnerGenerated=true`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${TOKEN}`,
          },
        },
      );
      const json = await res.json();
      return json.data;
    },
  });

  const campaigns: Winner[] = winnersData?.campaigns ?? [];

  // ✅ Pagination — API data থেকে
  const totalPages = winnersData?.paginationInfo?.totalPages ?? 1;
  const paginated = campaigns.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const getPageNumbers = () => {
    const pages: number[] = [];
    for (let i = 1; i <= Math.min(totalPages, 3); i++) pages.push(i);
    return pages;
  };

  // ✅ Publish mutation
  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/campaigns/${id}/publish-result`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${TOKEN}`, // ✅ এটা missing ছিল
          },
        },
      );
      return res.json();
    },
    onMutate: (id) => setPublishingId(id),
    onSettled: () => {
      setPublishingId(null);
      queryClient.invalidateQueries({ queryKey: ["winners"] });
    },
  });

  // ✅ Date format করার helper
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
  };

  // ✅ Ticket price — প্রথম package এর price নেওয়া হচ্ছে
  const getTicketPrice = (packages: { price: number }[]) => {
    return packages?.length > 0 ? `$${packages[0].price}` : "N/A";
  };

  return (
    <div className="min-h-screen">
      {/* Title */}
      <h1 className="text-white text-[24px] font-bold mb-8 leading-[120%]">
        Winners / Draw Results
      </h1>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <p className="text-[#888] text-sm">Loading winners...</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="rounded-xl overflow-hidden border border-[#2a2a2a]">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#e8b84b] hover:bg-[#e8b84b] border-0">
                  {[
                    "Prize Title",
                    "Winning Ticket Number",
                    "Winner Name",
                    "Draw Date",
                    "Total Ticket",
                    "Ticket Price",
                    "End Date",
                    "Result",
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

              <TableBody>
                {paginated.map((winner, index) => (
                  <TableRow
                    key={winner._id}
                    className={`border-b border-[#222222] hover:bg-[#1e1e1e] transition-colors ${
                      index % 2 === 0 ? "bg-[#161616]" : "bg-[#131313]"
                    }`}
                  >
                    {/* Prize Title */}
                    <TableCell className="py-4 text-center">
                      <div className="flex items-center gap-3 justify-center">
                        <PrizeThumbnail
                          image={winner.prizeImage}
                          title={winner.title}
                        />
                        <span className="text-[#C9C9C9] text-base font-medium whitespace-nowrap">
                          {winner.title}
                        </span>
                      </div>
                    </TableCell>

                    {/* Winning Ticket Number */}
                    <TableCell className="text-[#aaaaaa] text-base text-center py-4 whitespace-nowrap">
                      {winner.winningTicket}
                    </TableCell>

                    {/* Winner Name */}
                    <TableCell className="text-[#aaaaaa] text-base text-center py-4 whitespace-nowrap">
                      {winner.winnerId?.name ?? "—"}
                    </TableCell>

                    {/* Draw Date */}
                    <TableCell className="text-[#aaaaaa] text-base text-center py-4 whitespace-nowrap">
                      {formatDate(winner.drawDate)}
                    </TableCell>

                    {/* Total Ticket */}
                    <TableCell className="text-[#aaaaaa] text-base text-center py-4">
                      {winner.totalTickets}
                    </TableCell>

                    {/* Ticket Price */}
                    <TableCell className="text-[#aaaaaa] text-base text-center py-4">
                      {getTicketPrice(winner.packages)}
                    </TableCell>

                    {/* End Date */}
                    <TableCell className="text-[#aaaaaa] text-base text-center py-4 whitespace-nowrap">
                      {formatDate(winner.endDate)}
                    </TableCell>

                    {/* Result */}
                    <TableCell className="text-center py-4">
                      <div className="flex justify-center">
                        <ResultButton
                          result={
                            winner.isResultPublished ? "Published" : "Publish"
                          }
                          loading={publishingId === winner._id}
                          onClick={() => publishMutation.mutate(winner._id)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {/* Empty state */}
                {paginated.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-[#555] py-12 text-sm"
                    >
                      No winners found.
                    </TableCell>
                  </TableRow>
                )}
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
        </>
      )}
    </div>
  );
}

export default WinnersPage;
