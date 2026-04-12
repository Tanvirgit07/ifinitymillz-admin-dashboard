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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

// ✅ API status values match করানো হয়েছে
type StatusType = "Paid" | "Approved" | "Rejected" | "Pending";

interface WithdrawalItem {
  _id: string;
  userId: { _id: string; name: string; email: string };
  campaignId: { _id: string; title: string };
  amount: number;
  bankName: string;
  accountNumber: string;
  status: StatusType;
  method: string;
}

const STATUS_STYLES: Record<StatusType, { bg: string; text: string; border: string }> = {
  Paid:     { bg: "#1a3a2a", text: "#3dba6f", border: "#2a5a3a" },
  Approved: { bg: "#1a3a2a", text: "#3dba6f", border: "#2a5a3a" },
  Rejected: { bg: "#3a1a1a", text: "#e05555", border: "#5a2a2a" },
  Pending:  { bg: "#2a2510", text: "#c9a84c", border: "#4a4020" },
};

const ALL_STATUSES: StatusType[] = ["Paid", "Approved", "Rejected", "Pending"];

const PAGE_SIZE = 7;

function CampaignThumbnail() {
  return (
    <div
      className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center"
      style={{
        background: "linear-gradient(135deg, #c9501a 0%, #8a2a00 100%)",
        border: "1px solid #5a3020",
      }}
    >
      <span className="text-white text-sm">🏆</span>
    </div>
  );
}

function StatusDropdown({
  status,
  onStatusChange,
}: {
  status: StatusType;
  onStatusChange: (s: StatusType) => void;
}) {
  const styles = STATUS_STYLES[status];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors focus:outline-none"
          style={{
            background: styles.bg,
            color: styles.text,
            border: `1px solid ${styles.border}`,
          }}
        >
          {status}
          <ChevronDown size={12} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl p-1 shadow-xl min-w-[120px]"
      >
        {ALL_STATUSES.map((s) => {
          const st = STATUS_STYLES[s];
          return (
            <DropdownMenuItem
              key={s}
              onClick={() => onStatusChange(s)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-[#2a2a2a] focus:bg-[#2a2a2a]"
            >
              <span className="text-xs font-semibold" style={{ color: st.text }}>
                {s}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function WithdrawalRequest() {
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();
  const session = useSession();
  const TOKEN = session?.data?.user?.accessToken;

  // ✅ GET API — withdrawals list
  const { data: withdrawalData, isLoading } = useQuery({
  queryKey: ["withdrawals"],
  enabled: !!TOKEN, // ✅ TOKEN না থাকলে query run করবে না
  queryFn: async () => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/withdrawals`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TOKEN}`,
        },
      }
    );
    const json = await res.json();
    return json.data;
  },
});

  const withdrawals: WithdrawalItem[] = withdrawalData?.withdrawals ?? [];

  // ✅ Pagination
  const totalPages = withdrawalData?.paginationInfo?.totalPages ?? 1;
  const paginated = withdrawals.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const getPageNumbers = () => {
    const pages: number[] = [];
    for (let i = 1; i <= Math.min(totalPages, 3); i++) pages.push(i);
    return pages;
  };

  // ✅ Status update mutation — body তে { status } পাঠানো হচ্ছে
  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: StatusType }) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/withdrawals/${id}/status`,
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
      // ✅ Status update হলে list refresh
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
    },
  });

  const handleStatusChange = (id: string, newStatus: StatusType) => {
    updateMutation.mutate({ id, status: newStatus });
  };

  return (
    <div className="min-h-screen">
      {/* Title */}
      <h1 className="text-white text-[24px] font-bold mb-8 leading-[120%]">
        Withdrawal Request
      </h1>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <p className="text-[#888] text-sm">Loading withdrawals...</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="rounded-xl overflow-hidden border border-[#2a2a2a]">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#e8b84b] hover:bg-[#e8b84b] border-0">
                  {["Winner Name", "Campaign Name", "Amount", "Bank Name", "Acc.No.", "Status", "Method"].map(
                    (col) => (
                      <TableHead
                        key={col}
                        className="text-[#1F1F1F] text-base text-center py-4 font-medium whitespace-nowrap"
                      >
                        {col}
                      </TableHead>
                    )
                  )}
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginated.map((item, index) => (
                  <TableRow
                    key={item._id}
                    className={`border-b border-[#222222] hover:bg-[#1e1e1e] transition-colors ${
                      index % 2 === 0 ? "bg-[#161616]" : "bg-[#131313]"
                    }`}
                  >
                    {/* Winner Name */}
                    <TableCell className="text-[#C9C9C9] text-base font-medium text-center py-4 whitespace-nowrap">
                      {/* ✅ API থেকে userId.name */}
                      {item.userId?.name ?? "—"}
                    </TableCell>

                    {/* Campaign Name */}
                    <TableCell className="py-4 text-center">
                      <div className="flex items-center gap-3 justify-center">
                        <CampaignThumbnail />
                        <div className="flex flex-col items-start">
                          <span className="text-[#C9C9C9] text-sm font-semibold leading-[140%] whitespace-nowrap">
                            {/* ✅ API থেকে campaignId.title */}
                            {item.campaignId?.title ?? "—"}
                          </span>
                          <span className="text-[#666] text-xs leading-[140%] whitespace-nowrap">
                            {/* ✅ API থেকে method */}
                            {item.method}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Amount */}
                    <TableCell className="text-[#aaaaaa] text-base text-center py-4">
                      {/* ✅ API থেকে amount */}
                      ${item.amount}
                    </TableCell>

                    {/* Bank Name */}
                    <TableCell className="text-[#aaaaaa] text-base text-center py-4 whitespace-nowrap">
                      {/* ✅ API থেকে bankName */}
                      {item.bankName}
                    </TableCell>

                    {/* Acc No */}
                    <TableCell className="text-[#aaaaaa] text-base text-center py-4">
                      {/* ✅ API থেকে accountNumber */}
                      {item.accountNumber}
                    </TableCell>

                    {/* Status Dropdown */}
                    <TableCell className="text-center py-4">
                      <div className="flex justify-center">
                        <StatusDropdown
                          status={item.status}
                          onStatusChange={(s) => handleStatusChange(item._id, s)}
                        />
                      </div>
                    </TableCell>

                    {/* Method */}
                    <TableCell className="text-[#aaaaaa] text-base text-center py-4">
                      {item.method}
                    </TableCell>
                  </TableRow>
                ))}

                {/* Empty state */}
                {paginated.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-[#555] py-12 text-sm"
                    >
                      No withdrawal requests found.
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

export default WithdrawalRequest;