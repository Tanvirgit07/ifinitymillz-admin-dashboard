"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface ContactMessage {
  _id: string;
  name: string;
  phoneNumber: string;
  email: string;
  message: string;
  createdAt: string;
}

interface ViewContactModalProps {
  contactMessage: ContactMessage;
}

export function ViewContactModal({ contactMessage }: ViewContactModalProps) {
  const [open, setOpen] = useState(false);

  // Fetch single message from API
  const { data: message, isLoading, error } = useQuery({
    queryKey: ["contactMessage", contactMessage._id],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/contact/${contactMessage._id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            // Authorization: `Bearer ${TOKEN}` // add if needed
          },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch message details");
      const result = await res.json();
      return result.data; // API returns { data: { ... } }
    },
    enabled: open, // Only fetch when modal is opened
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-600 hover:text-gray-900"
          title="View message"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px] p-0 gap-0 bg-white rounded-xl border shadow-2xl overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-5 border-b bg-white">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Message Details
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="px-6 py-6 space-y-6 text-sm">
          {isLoading && <p>Loading message...</p>}
          {error && <p className="text-red-500">Failed to load message</p>}
          {message && (
            <>
              {/* From, Phone, Email */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
                <div>
                  <div className="text-gray-500 mb-0.5">From</div>
                  <div className="font-medium text-gray-900">{message.name}</div>
                </div>

                <div>
                  <div className="text-gray-500 mb-0.5">Phone Number</div>
                  <div className="font-medium text-gray-900">{message.phoneNumber}</div>
                </div>

                <div>
                  <div className="text-gray-500 mb-0.5">Email</div>
                  <div className="font-medium text-gray-900 break-all">
                    {message.email}
                  </div>
                </div>
              </div>

              {/* Received */}
              <div>
                <div className="text-gray-500 mb-0.5">Received</div>
                <div className="font-medium text-gray-900">
                  {new Date(message.createdAt).toLocaleString()}
                </div>
              </div>

              {/* Subject */}
              <div>
                <div className="text-gray-500 mb-0.5">Message</div>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-md min-h-[140px] text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {message.message}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-5 border-t bg-gray-50 flex justify-end gap-3">
          <DialogClose asChild>
            <Button variant="outline" className="min-w-[90px] border-gray-300">
              Close
            </Button>
          </DialogClose>

          <Button className="min-w-[90px] bg-green-600 hover:bg-green-700 text-white">
            ✓ Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}