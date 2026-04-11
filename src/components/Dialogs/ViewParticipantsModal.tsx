"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Eye, X } from "lucide-react";

interface Ticket {
  id: string;
  ticketNumber: string;
  date: string;
}

interface TicketWithSerial extends Ticket {
  serial: number;
}

function TicketCard({ ticket }: { ticket: TicketWithSerial }) {
  return (
    <div className="bg-[#e1bb54] rounded-[2px] px-2 py-2 flex items-center gap-2 min-h-[58px]">
      {/* Number circle */}
      <div className="w-8 h-8 rounded-full bg-[#d4a83a] flex items-center justify-center flex-shrink-0">
        <span className="text-white text-sm font-bold">{ticket.serial}</span>
      </div>

      {/* Info */}
      <div className="flex gap-6">
        <div className="flex flex-col">
          <span className="text-[#fff6d8] text-[10px] font-medium leading-none mb-1">
            Ticket Number
          </span>
          <span className="text-white text-sm font-bold leading-none">
            {ticket.ticketNumber}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[#fff6d8] text-[10px] font-medium leading-none mb-1">
            Date
          </span>
          <span className="text-white text-sm font-bold leading-none">
            {ticket.date}
          </span>
        </div>
      </div>
    </div>
  );
}

interface ViewParticipantsModalProps {
  tickets?: Ticket[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ViewParticipantsModal({
  tickets = [],
  open: controlledOpen,
  onOpenChange,
}: ViewParticipantsModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const ticketsWithSerial: TicketWithSerial[] = tickets.map((ticket, index) => ({
    ...ticket,
    serial: index + 1,
  }));
  const leftCol = ticketsWithSerial.filter((ticket) => ticket.serial % 2 !== 0);
  const rightCol = ticketsWithSerial.filter((ticket) => ticket.serial % 2 === 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!onOpenChange && (
        <DialogTrigger asChild>
          <button
            className="w-8 h-8 rounded-md bg-[#1a3a2a] border border-[#2a5a3a] flex items-center justify-center hover:bg-[#224d38] transition-colors group"
            title="View"
          >
            <Eye
              size={15}
              className="text-[#3dba6f] group-hover:text-[#4fd080]"
            />
          </button>
        </DialogTrigger>
      )}

      <DialogContent
        className="w-[92vw] max-w-[760px] p-0 gap-0 border border-[#2c2d31] rounded-lg overflow-hidden bg-[#23252b] shadow-2xl"
        // Hide the default shadcn close button
        style={{ ["--tw-ring-shadow" as string]: "none" }}
      >
        {/* Hide default X from shadcn */}
        <style>{`
          [data-radix-dialog-close] { display: none !important; }
        `}</style>

        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-3 flex flex-row items-center justify-between">
          <DialogTitle className="text-white text-[31px] font-semibold leading-none">
            Ticket Details
          </DialogTitle>
          <button
            onClick={() => setOpen(false)}
            className="text-[#d8d8d8] hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </DialogHeader>

        {/* Tickets Grid */}
        <div className="px-4 pb-4">
          {tickets.length === 0 ? (
            <div className="text-[#b9b9b9] text-sm text-center py-8">
              No tickets found.
            </div>
          ) : (
            <div className="relative grid grid-cols-2 gap-0 max-h-[70vh] overflow-y-auto">
              <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px bg-[#3a3b40] -translate-x-1/2" />
              {/* Left Column */}
              <div className="flex flex-col gap-2 pr-3">
                {leftCol.map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} />
                ))}
              </div>

              {/* Right Column */}
              <div className="flex flex-col gap-2 pl-3">
                {rightCol.map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} />
                ))}
              </div>
            </div>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
}

export default ViewParticipantsModal;
