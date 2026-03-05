"use client";

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
import { AlertTriangle, Trash2 } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

interface DeleteModalProps {
  messageId: string;
}

export function DeleteModal({ messageId }: DeleteModalProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const session = useSession();
  const TOKEN = session?.data?.user?.accessToken;

  // Mutation to delete message
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/contact/${messageId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${TOKEN}` // if needed
          },
        }
      );
      if (!res.ok) throw new Error("Failed to delete message");
      return res.json();
    },
    onSuccess: () => {
      // Refetch messages after deletion
      queryClient.invalidateQueries({ queryKey: ["contactMessages"] });
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
          title="Delete message"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[380px] p-6 gap-0 rounded-xl border shadow-xl">
        {/* Warning Icon + Title */}
        <DialogHeader className="pb-4">
          <div className="items-start gap-4 ">
            {/* Alert Icon */}
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 shrink-0">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>

            {/* Text Content */}
            <div className="mt-5">
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Are You Sure?
              </DialogTitle>

              <p className="text-base text-gray-600 mt-2">
                Are you sure you want to delete this Message?
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Buttons */}
        <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6">
          <DialogClose asChild>
            <Button
              variant="outline"
              className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
          </DialogClose>

          <Button
            variant="destructive"
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}