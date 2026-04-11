"use client";

import React, { useEffect, useMemo, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
// import ViewParticipantsModal from "@/components/Dialogs/ViewParticipantsModal";
// import ViewUserModal from "@/components/Dialogs/ViewUserModal";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import ViewParticipantsModal from "@/components/Dialogs/ViewParticipantsModal";
import ViewUserModal from "@/components/Dialogs/ViewUserModal";

type EntryType = "FREE" | "PAID";

interface EntryTicket {
  _id: string;
  ticketNumber: string;
  createdAt?: string;
}

interface UserDetail {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

interface CampaignDetail {
  _id: string;
  title: string;
  totalTickets?: number;
  soldTickets?: number;
  remainingTickets?: number;
}

interface PackageInfo {
  name?: string;
  ticketQuantity?: number;
  price?: number;
}

interface EntryDetail {
  _id: string;
  userId?: UserDetail;
  campaignId?: CampaignDetail;
  quantity?: number;
  entryType?: string;
  amount?: number;
  paymentStatus?: string;
  transactionId?: string;
  createdAt?: string;
  packageInfo?: PackageInfo;
}

interface ParticipantEntry {
  _id: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
  };
  campaignId?: {
    _id: string;
    title: string;
  };
  quantity: number;
  tickets: EntryTicket[];
  entryType: EntryType;
  amount: number;
  createdAt: string;
}

const PAGE_SIZE = 10;

function EntryBadge({ type }: { type: EntryType }) {
  if (type === "FREE") {
    return (
      <Badge className="bg-[#1a3a2a] hover:bg-[#1a3a2a] text-[#3dba6f] text-xs font-semibold px-3 py-1 rounded-full border border-[#2a5a3a] cursor-default">
        Free
      </Badge>
    );
  }
  return (
    <Badge className="bg-[#3a2a10] hover:bg-[#3a2a10] text-[#c9a84c] text-xs font-semibold px-3 py-1 rounded-full border border-[#5a4a20] cursor-default">
      Paid
    </Badge>
  );
}

function ParticipantsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState<
    { id: string; ticketNumber: string; date: string }[]
  >([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedEntryDetail, setSelectedEntryDetail] = useState<EntryDetail | null>(null);

  const session = useSession();
  const TOKEN = session?.data?.user?.accessToken;

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const { data: participantData, isLoading } = useQuery({
    queryKey: ["entry", currentPage, debouncedSearch],
    enabled: !!TOKEN,
    queryFn: async () => {
      const queryParams = new URLSearchParams({
        page: String(currentPage),
        limit: String(PAGE_SIZE),
      });
      if (debouncedSearch) {
        queryParams.set("ticketNumber", debouncedSearch);
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/entries?${queryParams.toString()}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${TOKEN}`,
          },
        }
      );
      const json = await res.json();
      if (!res.ok || !json?.status) {
        throw new Error(json?.message || "Failed to fetch entries");
      }
      return json?.data;
    },
  });

  const fetchEntryById = async (entryId: string): Promise<EntryDetail> => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/entries/${entryId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TOKEN}`,
        },
      }
    );
    const json = await res.json();
    if (!res.ok || !json?.status) throw new Error("Failed to fetch entry");
    return json?.data;
  };

  const rawEntries = Array.isArray(participantData?.entries)
    ? participantData.entries
    : participantData?._id
      ? [participantData]
      : [];

  const sortedEntries: ParticipantEntry[] = [...rawEntries].sort(
    (a: ParticipantEntry, b: ParticipantEntry) =>
      new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime()
  );

  const paginated: ParticipantEntry[] = useMemo(() => {
    if (!debouncedSearch) return sortedEntries;
    const q = debouncedSearch.toLowerCase();
    return sortedEntries.filter((entry) => {
      const tickets = (entry.tickets || []).map((t) => t.ticketNumber).join(" ");
      return (
        (entry.userId?.name || "").toLowerCase().includes(q) ||
        (entry.userId?.email || "").toLowerCase().includes(q) ||
        (entry.campaignId?.title || "").toLowerCase().includes(q) ||
        (entry.entryType || "").toLowerCase().includes(q) ||
        tickets.toLowerCase().includes(q)
      );
    });
  }, [sortedEntries, debouncedSearch]);

  const totalPages = Math.max(
    1,
    Number(participantData?.paginationInfo?.totalPages || 1)
  );
  const totalData = Number(participantData?.paginationInfo?.totalData || paginated.length);
  const shouldShowPagination = totalData > 10;

  const getPageNumbers = () => {
    const pages: number[] = [];
    for (let i = 1; i <= Math.min(totalPages, 3); i++) pages.push(i);
    return pages;
  };

  return (
    <div className="min-h-screen">
      <div className="">
        {/* Title + Search */}
        <div className="mb-10 flex items-center justify-between gap-4">
          <h1 className="text-white text-[24px] font-bold leading-[120%]">
            Participants / Entries
          </h1>
          <div className="w-full max-w-[320px]">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ticket/user/campaign..."
              className="h-10 bg-[#1a1a1a] border-[#2e2e2e] text-[#C9C9C9] placeholder:text-[#666] focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>

        {/* Table Container */}
        <div className="rounded-xl overflow-hidden border border-[#2a2a2a]">
          <Table>
            {/* Header */}
            <TableHeader>
              <TableRow className="bg-[#e8b84b] hover:bg-[#e8b84b] border-0">
                {["User Name", "Email", "Campaign Name", "Tickets", "Entry Type", "Amount", "Date", "Actions"].map(
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

            {/* Body */}
            <TableBody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <TableRow
                      key={`participant-skeleton-${index}`}
                      className={`border-b border-[#222222] ${
                        index % 2 === 0 ? "bg-[#161616]" : "bg-[#131313]"
                      }`}
                    >
                      <TableCell className="text-center py-5"><Skeleton className="h-5 w-28 mx-auto bg-[#2a2a2a]" /></TableCell>
                      <TableCell className="text-center py-5"><Skeleton className="h-5 w-44 mx-auto bg-[#2a2a2a]" /></TableCell>
                      <TableCell className="text-center py-5"><Skeleton className="h-5 w-36 mx-auto bg-[#2a2a2a]" /></TableCell>
                      <TableCell className="text-center py-5"><Skeleton className="h-5 w-24 mx-auto bg-[#2a2a2a]" /></TableCell>
                      <TableCell className="text-center py-5"><Skeleton className="h-6 w-16 mx-auto rounded-full bg-[#2a2a2a]" /></TableCell>
                      <TableCell className="text-center py-5"><Skeleton className="h-5 w-14 mx-auto bg-[#2a2a2a]" /></TableCell>
                      <TableCell className="text-center py-5"><Skeleton className="h-5 w-20 mx-auto bg-[#2a2a2a]" /></TableCell>
                      <TableCell className="text-center py-5"><Skeleton className="h-8 w-8 mx-auto rounded-md bg-[#2a2a2a]" /></TableCell>
                    </TableRow>
                  ))
                : paginated.map((p, index) => (
                    <TableRow
                      key={p._id}
                      className={`border-b border-[#222222] hover:bg-[#1e1e1e] transition-colors ${
                        index % 2 === 0 ? "bg-[#161616]" : "bg-[#131313]"
                      }`}
                    >
                  {/* User Name */}
                  <TableCell className="text-[#C9C9C9] text-base font-medium text-center py-5 leading-[120%] whitespace-nowrap">
                    {p.userId?.name || "-"}
                  </TableCell>

                  {/* Email */}
                  <TableCell className="text-[#aaaaaa] text-base text-center py-5 leading-[120%] whitespace-nowrap">
                    {p.userId?.email || "-"}
                  </TableCell>

                  {/* Campaign Name */}
                  <TableCell className="text-[#aaaaaa] text-base text-center py-5 leading-[120%] whitespace-nowrap">
                    {p.campaignId?.title || "-"}
                  </TableCell>

                  {/* Tickets */}
                  <TableCell className="text-center py-5">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-[#aaaaaa] text-base leading-[120%]">
                        {p.quantity} Tickets
                      </span>
                      <Eye
                        size={16}
                        className="text-[#c9a84c] cursor-pointer hover:text-[#e8b84b] transition-colors"
                        onClick={() => {
                          const mappedTickets = (p.tickets || []).map((ticket) => ({
                            id: ticket._id,
                            ticketNumber: ticket.ticketNumber,
                            date: ticket.createdAt
                              ? new Date(ticket.createdAt).toLocaleDateString("en-GB")
                              : "-",
                          }));
                          setSelectedTickets(mappedTickets);
                          setIsTicketModalOpen(true);
                        }}
                      />
                    </div>
                  </TableCell>

                  {/* Entry Type */}
                  <TableCell className="text-center py-5">
                    <div className="flex justify-center">
                      <EntryBadge type={p.entryType} />
                    </div>
                  </TableCell>

                  {/* Amount */}
                  <TableCell className="text-[#aaaaaa] text-base text-center py-5 leading-[120%]">
                    {p.entryType === "FREE" ? "x" : `$${p.amount}`}
                  </TableCell>

                  {/* Date */}
                  <TableCell className="text-[#aaaaaa] text-base text-center py-5 leading-[120%] whitespace-nowrap">
                    {p.createdAt
                      ? new Date(p.createdAt).toLocaleDateString("en-GB")
                      : "-"}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-center py-5">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className="w-8 h-8 rounded-md bg-[#3a2a10] border border-[#5a4a20] flex items-center justify-center hover:bg-[#4d3a15] transition-colors group"
                        title="View Details"
                        onClick={async () => {
                          if (p._id) {
                            const entryData = await fetchEntryById(p._id);
                            setSelectedEntryDetail(entryData);
                            setIsUserModalOpen(true);
                          }
                        }}
                      >
                        <Eye size={15} className="text-[#c9a84c] group-hover:text-[#e8b84b]" />
                      </button>
                    </div>
                  </TableCell>
                    </TableRow>
                  ))}

              {!isLoading && paginated.length === 0 && (
                <TableRow className="bg-[#161616]">
                  <TableCell colSpan={8} className="text-center py-10 text-[#888]">
                    No entries found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {shouldShowPagination && !isLoading && (
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
        )}

        <ViewParticipantsModal
          open={isTicketModalOpen}
          onOpenChange={setIsTicketModalOpen}
          tickets={selectedTickets}
        />

        <ViewUserModal
          open={isUserModalOpen}
          onOpenChange={setIsUserModalOpen}
          entry={selectedEntryDetail}
        />
      </div>
    </div>
  );
}

export default ParticipantsPage;
