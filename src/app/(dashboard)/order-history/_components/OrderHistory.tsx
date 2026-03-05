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
import { Eye } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

const ITEMS_PER_PAGE = 5;

export default function OrderHistory() {
  const [currentPage, setCurrentPage] = useState(1);
  const session = useSession();
  const TOKEN = session?.data?.user?.accessToken;

  // Fetch real payments/orders from API
  const { data: ordersData, isLoading, error } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/payment`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${TOKEN}`,
          },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch orders");
      const result = await res.json();
      return result.data; // the array of payments
    },
  });

  if (isLoading) return <p>Loading orders...</p>;
  if (error) return <p>Error loading orders</p>;

  const totalItems = ordersData?.length || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedOrders = ordersData?.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  return (
    <div className="">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Order History
        </h1>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-[180px] pl-6">User ID</TableHead>
              <TableHead className="w-[180px]">Products</TableHead>
              <TableHead className="w-[140px]">Date</TableHead>
              <TableHead className="w-[120px]">Amount (USD)</TableHead>
              <TableHead className="w-[100px] text-center">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedOrders?.map((order: any) => (
              <TableRow
                key={order._id}
                className="hover:bg-gray-50/70 border-b last:border-0"
              >
                {/* User ID */}
                <TableCell className="pl-6 font-medium">{order.user}</TableCell>

                {/* Products */}
                <TableCell className="text-gray-700">
                  {order.items
                    .map(
                      (item: any) =>
                        `${item.product} x${item.qty} (${item.size})`
                    )
                    .join(", ")}
                </TableCell>

                {/* Date */}
                <TableCell className="text-gray-600">
                  {new Date(order.createdAt).toLocaleDateString()}
                </TableCell>

                {/* Amount */}
                <TableCell className="font-medium text-gray-900">
                  {order.amount}
                </TableCell>

                {/* Action */}
                <TableCell className="text-center">
                  <Link href={`/order-history/view-orderinfo/${order._id}`}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-600 hover:text-gray-900"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Footer - Showing info + Pagination */}
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
            onClick={() =>
              setCurrentPage((p) => Math.min(p + 1, totalPages))
            }
            className="h-9 px-3"
          >
            →
          </Button>
        </div>
      </div>
    </div>
  );
}