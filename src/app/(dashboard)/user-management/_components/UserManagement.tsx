"use client";

import React, { useEffect, useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Ban } from "lucide-react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useSession } from "next-auth/react";

type UserStatus = "Pending" | "Approved" | "Rejected" | "Suspended";

interface ApiUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt?: string;
  status?: UserStatus;
}

const PAGE_SIZE = 10;

function ActionButtons({
  status,
  isLoading,
  onAccept,
  onReject,
  onSuspend,
}: {
  status: UserStatus;
  isLoading: boolean;
  onAccept: () => void;
  onReject: () => void;
  onSuspend: () => void;
}) {
  if (status === "Suspended") {
    return (
      <Badge className="bg-[#e05555] hover:bg-[#c94444] text-white text-[14px] font-semibold px-4 py-1.5 rounded-full flex items-center gap-1 cursor-pointer border-0 pointer-events-none opacity-80">
        <Ban size={12} />
        Suspend
      </Badge>
    );
  }

  if (status === "Approved") {
    return (
      <Badge
        onClick={onSuspend}
        className={`bg-[#e05555] hover:bg-[#c94444] text-white text-[14px] font-semibold px-4 py-1.5 rounded-full flex items-center gap-1 cursor-pointer border-0 transition-colors ${
          isLoading ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <Ban size={12} />
        Suspend
      </Badge>
    );
  }

  if (status === "Rejected") {
    return (
      <Badge className="bg-[#e05555] hover:bg-[#c94444] text-white text-[14px] font-semibold px-4 py-1.5 rounded-full cursor-pointer border-0 pointer-events-none opacity-60">
        Rejected
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge
        onClick={onAccept}
        className={`bg-[#3dba6f] hover:bg-[#34a561] text-white text-[14px] font-semibold px-4 py-1.5 rounded-full cursor-pointer border-0 transition-colors ${
          isLoading ? "pointer-events-none opacity-60" : ""
        }`}
      >
        Accept
      </Badge>
      <Badge
        onClick={onReject}
        className={`bg-[#e05555] hover:bg-[#c94444] text-white text-[14px] font-semibold px-4 py-1.5 rounded-full cursor-pointer border-0 transition-colors ${
          isLoading ? "pointer-events-none opacity-60" : ""
        }`}
      >
        Reject
      </Badge>
    </div>
  );
}

function UserManagement() {
  const [currentPage, setCurrentPage] = useState(1);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const session = useSession();
  const TOKEN = session?.data?.user?.accessToken;

  const { data: userData, isLoading } = useQuery({
    queryKey: ["user-data", currentPage],
    enabled: !!TOKEN,
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/user/all-users?page=${currentPage}&limit=${PAGE_SIZE}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${TOKEN}`,
          },
        }
      );

      const json = await res.json();
      if (!res.ok || !json?.status) {
        throw new Error(json?.message || "Failed to fetch users");
      }
      return json?.data;
    },
  });

  const paginatedUsers: ApiUser[] = userData?.users ?? [];
  const totalPages = Math.max(1, Number(userData?.paginationInfo?.totalPages || 1));
  const totalData = Number(userData?.paginationInfo?.totalData || 0);
  const shouldShowPagination = totalData > 10;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= Math.min(totalPages, 3); i++) pages.push(i);
    return pages;
  };

  const updateStatus = useMutation({
    mutationFn: async ({
      userId,
      status,
    }: {
      userId: string;
      status: UserStatus;
    }) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/user/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${TOKEN}`,
          },
          body: JSON.stringify({
            status,
            isVerified: status === "Approved",
          }),
        }
      );

      const json = await res.json();
      if (!res.ok || !json?.status) {
        throw new Error(json?.message || "Failed to update status");
      }
      return json;
    },
    onMutate: ({ userId }) => {
      setActiveRowId(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-data"] });
    },
    onSettled: () => {
      setActiveRowId(null);
    },
  });

  return (
    <div className="min-h-screen">
      <div className="">
        {/* Title */}
        <h1 className="text-white text-[24px] font-bold mb-10 leading-[120%]">
          User Management
        </h1>

        {/* Table Container */}
        <div className="rounded-xl overflow-hidden border border-[#2a2a2a]">
          <Table>
            {/* Header */}
            <TableHeader>
              <TableRow className="bg-[#e8b84b] hover:bg-[#e8b84b] border-0">
                <TableHead className="text-[#1F1F1F] text-base text-center py-4 font-medium">
                  User Name
                </TableHead>
                <TableHead className="text-[#1F1F1F] text-base text-center py-4 font-medium">
                  Email
                </TableHead>
                <TableHead className="text-[#1F1F1F] text-base text-center py-4 font-medium">
                  Phone Number
                </TableHead>
                <TableHead className="text-[#1F1F1F] text-base text-center py-4 font-medium">
                  Date
                </TableHead>
                <TableHead className="text-[#1F1F1F] text-base text-center py-4 font-medium">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            {/* Body */}
            <TableBody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <TableRow
                      key={`skeleton-${index}`}
                      className={`
                    border-b border-[#222222] hover:bg-[#1e1e1e] transition-colors
                    ${index % 2 === 0 ? "bg-[#161616]" : "bg-[#131313]"}
                  `}
                    >
                      <TableCell className="text-center py-5">
                        <Skeleton className="h-5 w-32 mx-auto bg-[#2a2a2a]" />
                      </TableCell>
                      <TableCell className="text-center py-5">
                        <Skeleton className="h-5 w-44 mx-auto bg-[#2a2a2a]" />
                      </TableCell>
                      <TableCell className="text-center py-5">
                        <Skeleton className="h-5 w-24 mx-auto bg-[#2a2a2a]" />
                      </TableCell>
                      <TableCell className="text-center py-5">
                        <Skeleton className="h-5 w-28 mx-auto bg-[#2a2a2a]" />
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <div className="flex justify-center">
                          <Skeleton className="h-8 w-24 rounded-full bg-[#2a2a2a]" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                : paginatedUsers.map((user, index) => (
                    <TableRow
                      key={user._id}
                      className={`
                    border-b border-[#222222] hover:bg-[#1e1e1e] transition-colors
                    ${index % 2 === 0 ? "bg-[#161616]" : "bg-[#131313]"}
                  `}
                    >
                      <TableCell className="text-[#C9C9C9] text-base font-medium text-center py-5 leading-[120%]">
                        {user.name}
                      </TableCell>
                      <TableCell className="text-[#aaaaaa] text-base text-center py-5 leading-[120%]">
                        {user.email}
                      </TableCell>
                      <TableCell className="text-[#aaaaaa] text-base text-center py-5 leading-[120%]">
                        {user.phone || "N/A"}
                      </TableCell>
                      <TableCell className="text-[#aaaaaa] text-base text-center py-5 leading-[120%]">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "2-digit",
                              year: "numeric",
                            })
                          : "-"}
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <div className="flex justify-center">
                          <ActionButtons
                            status={user.status || "Pending"}
                            isLoading={updateStatus.isPending && activeRowId === user._id}
                            onAccept={() =>
                              updateStatus.mutate({
                                userId: user._id,
                                status: "Approved",
                              })
                            }
                            onReject={() =>
                              updateStatus.mutate({
                                userId: user._id,
                                status: "Rejected",
                              })
                            }
                            onSuspend={() =>
                              updateStatus.mutate({
                                userId: user._id,
                                status: "Suspended",
                              })
                            }
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {shouldShowPagination && (
          <div className="flex justify-end items-center gap-1 mt-5">
          {/* Prev */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="w-9 h-9 rounded-md bg-[#1a1a1a] border-[#2e2e2e] text-[#888] hover:bg-[#252525] hover:text-white disabled:opacity-30"
          >
            <ChevronLeft size={14} />
          </Button>

          {/* Page Numbers */}
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

          {/* Next */}
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
      </div>
    </div>
  );
}

export default UserManagement;
