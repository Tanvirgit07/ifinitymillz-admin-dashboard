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
import { ChevronLeft, ChevronRight, Eye, CheckCircle, XCircle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { CampaignDetailsModal } from "./CampaignDetailsModal";

type StatusType = "Pending" | "Approved" | "Paid" | "Rejected";

interface ApplicationItem {
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
  createdAt: string;
}

const PAGE_SIZE = 7;

function CampaignApplication() {
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const TOKEN = session?.user?.accessToken;

  // ✅ GET all applications
  const { data: responseData, isLoading } = useQuery({
    queryKey: ["campaignApplications", currentPage],
    enabled: !!TOKEN,
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/applications?page=${currentPage}&limit=${PAGE_SIZE}`,
        {
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

  const applications: ApplicationItem[] = responseData?.applications ?? [];
  const totalPages = responseData?.paginationInfo?.totalPages ?? 1;

  const getPageNumbers = () =>
    Array.from({ length: totalPages }, (_, i) => i + 1);

  // ✅ Status update mutation (table-এর Accept/Reject button থেকে)
  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: StatusType }) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/applications/${id}/status`,
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
      queryClient.invalidateQueries({ queryKey: ["campaignApplications"] });
    },
  });

  const handleViewDetails = (id: string) => {
    setSelectedId(id);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedId(null);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen">
      <h1 className="text-white text-[24px] font-bold mb-6 leading-[120%]">
        Campaign Application
      </h1>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <p className="text-[#888] text-sm">Loading applications...</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="rounded-xl overflow-hidden border border-[#2a2a2a]">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#e8b84b] hover:bg-[#e8b84b] border-0">
                  {["Full Name", "Email", "Phone Number", "Date", "Actions"].map((col) => (
                    <TableHead
                      key={col}
                      className={`text-[#1F1F1F] text-sm py-4 font-semibold whitespace-nowrap ${
                        col === "Actions" ? "text-right pr-6" : "text-center"
                      }`}
                    >
                      {col}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {applications.map((item, index) => (
                  <TableRow
                    key={item._id}
                    className={`border-b border-[#222222] hover:bg-[#1e1e1e] transition-colors ${
                      index % 2 === 0 ? "bg-[#161616]" : "bg-[#131313]"
                    }`}
                  >
                    <TableCell className="text-[#C9C9C9] text-sm font-medium text-center py-4 whitespace-nowrap">
                      {item.fullName}
                    </TableCell>
                    <TableCell className="text-[#aaaaaa] text-sm text-center py-4">
                      {item.email}
                    </TableCell>
                    <TableCell className="text-[#aaaaaa] text-sm text-center py-4">
                      {item.phone}
                    </TableCell>
                    <TableCell className="text-[#aaaaaa] text-sm text-center py-4 whitespace-nowrap">
                      {formatDate(item.createdAt)}
                    </TableCell>

                    {/* Actions — right aligned */}
                    <TableCell className="py-4 pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() =>
                            updateMutation.mutate({ id: item._id, status: "Approved" })
                          }
                          disabled={updateMutation.isPending}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                          style={{ background: "#3dba6f" }}
                        >
                          <CheckCircle size={11} />
                          Accept
                        </button>

                        <button
                          onClick={() =>
                            updateMutation.mutate({ id: item._id, status: "Rejected" })
                          }
                          disabled={updateMutation.isPending}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                          style={{ background: "#e05555" }}
                        >
                          <XCircle size={11} />
                          Reject
                        </button>

                        <button
                          onClick={() => handleViewDetails(item._id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-opacity hover:opacity-80"
                          style={{
                            background: "#1a3a5a",
                            color: "#7ec8f5",
                            border: "1px solid #2a5a8a",
                          }}
                        >
                          <Eye size={11} />
                          view details
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {applications.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-[#555] py-12 text-sm"
                    >
                      No applications found.
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

      {/* Modal */}
      {selectedId && (
        <CampaignDetailsModal
          open={modalOpen}
          onOpenChange={handleModalClose}
          applicationId={selectedId}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["campaignApplications"] });
            handleModalClose();
          }}
        />
      )}
    </div>
  );
}

export default CampaignApplication;