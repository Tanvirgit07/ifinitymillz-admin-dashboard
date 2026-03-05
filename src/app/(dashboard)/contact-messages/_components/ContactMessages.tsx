/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { ViewContactModal } from "@/components/Dialogs/ViewContactModal";
import { DeleteModal } from "@/components/Dialogs/DeleteModal";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

const ITEMS_PER_PAGE = 5;

export default function ContactMessages() {
  const [currentPage, setCurrentPage] = useState(1);
  const session = useSession();
  const TOKEN = session?.data?.user?.accessToken;

  // Fetch real contact messages from API
  const { data: contactMessages, isLoading, error } = useQuery({
    queryKey: ["contactMessages"],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/contact`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${TOKEN}`, // include token if needed
          },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch contact messages");
      const result = await res.json();
      return result.data; // API returns { data: [...] }
    },
  });

  if (isLoading) return <p>Loading messages...</p>;
  if (error) return <p>Error loading messages</p>;

  const totalItems = contactMessages?.length || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedMessages = contactMessages?.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  return (
    <div className="">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Contact Messages
        </h1>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader className="bg-blue-50/70">
            <TableRow>
              <TableHead className="w-[180px] pl-6">Name</TableHead>
              <TableHead className="w-[160px]">Phone Number</TableHead>
              <TableHead className="w-[260px]">Subject</TableHead>
              <TableHead className="w-[160px]">Received</TableHead>
              <TableHead className="w-[100px] text-center">Status</TableHead>
              <TableHead className="w-[120px] text-center">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedMessages?.map((msg: any) => (
              <TableRow
                key={msg._id}
                className="hover:bg-gray-50/70 transition-colors"
              >
                <TableCell className="pl-6 font-medium py-3">
                  <div className="flex flex-col">
                    <span>{msg.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {msg.email}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-gray-600">{msg.phoneNumber}</TableCell>
                <TableCell className="text-gray-700">{msg.message}</TableCell>
                <TableCell className="text-gray-600">
                  {new Date(msg.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <ViewContactModal contactMessage={msg} />
                    <DeleteModal messageId={msg._id} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-muted-foreground">
        <p>
          Showing {startIndex + 1} to{" "}
          {Math.min(startIndex + ITEMS_PER_PAGE, totalItems)} of {totalItems}{" "}
          results
        </p>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            className="h-9 px-3"
          >
            ←
          </Button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              className={`h-9 w-9 p-0 ${
                page === currentPage
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : ""
              }`}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </Button>
          ))}

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            className="h-9 px-3"
          >
            →
          </Button>
        </div>
      </div>
    </div>
  );
}