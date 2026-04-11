"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

interface ViewUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: EntryDetail | null;
}

const formatDate = (date?: string) => {
  if (!date) return "-";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB");
};

const shortTransactionId = (id?: string) => {
  if (!id) return "-";
  if (id.length <= 24) return id;
  return `${id.slice(0, 12)}...${id.slice(-8)}`;
};

export default function ViewUserModal({
  open,
  onOpenChange,
  entry,
}: ViewUserModalProps) {
  if (!entry) return null;

  const fields = [
    { label: "User Name", value: entry.userId?.name || "-" },
    { label: "Email", value: entry.userId?.email || "-" },
    { label: "Phone", value: entry.userId?.phone || "-" },
    { label: "Campaign", value: entry.campaignId?.title || "-" },
    { label: "Entry Type", value: entry.entryType || "-" },
    { label: "Package", value: entry.packageInfo?.name || "-" },
    { label: "Quantity", value: String(entry.quantity ?? "-") },
    {
      label: "Amount",
      value:
        entry.entryType === "FREE"
          ? "x"
          : entry.amount !== undefined
            ? `$${entry.amount}`
            : "-",
    },
    { label: "Payment", value: entry.paymentStatus || "-" },
    { label: "Date", value: formatDate(entry.createdAt) },
    { label: "Transaction", value: shortTransactionId(entry.transactionId) },
    { label: "Entry ID", value: entry._id || "-" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#161616] border border-[#2a2a2a] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#e8b84b] text-lg font-bold">
            Entry Details
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          {fields.map(({ label, value }) => (
            <div
              key={label}
              className="flex justify-between items-center border-b border-[#222] pb-2 gap-3"
            >
              <span className="text-[#888] text-sm">{label}</span>
              <span className="text-[#C9C9C9] text-sm font-medium text-right break-all">
                {value}
              </span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
