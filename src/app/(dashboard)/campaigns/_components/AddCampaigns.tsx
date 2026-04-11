"use client";

import { useEffect, useMemo, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Plus, Upload, Trash2 } from "lucide-react";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface PackageInput {
  id: number;
  name: string;
  quantity: string;
  price: string;
}

interface CampaignLite {
  _id: string;
  isFeatured?: boolean;
}

const inputClass =
  "w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg px-4 py-2.5 text-[#C9C9C9] text-sm placeholder:text-[#555] focus:outline-none focus:border-[#c9a84c] transition-colors";

const labelClass = "text-[#C9C9C9] text-sm font-medium mb-1.5 block";

export function AddCampaigns() {
  const [featured, setFeatured] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [packages, setPackages] = useState<PackageInput[]>([
    { id: 1, name: "Advantage", quantity: "5", price: "20" },
  ]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    maxFreeEntries: "1",
    totalTickets: "",
    startDate: "",
    endDate: "",
    drawDate: "",
  });

  const session = useSession();
  const TOKEN = session?.data?.user?.accessToken;
  const queryClient = useQueryClient();

  const { data: campaignsData } = useQuery({
    queryKey: ["campaigns-feature-check"],
    enabled: !!TOKEN,
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/campaigns?page=1&limit=200`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${TOKEN}`,
          },
        }
      );
      const json = await res.json();
      if (!res.ok || !json?.status) {
        throw new Error(json?.message || "Failed to fetch campaigns");
      }
      return json?.data;
    },
  });

  const hasFeaturedCampaign = useMemo(() => {
    const list: CampaignLite[] = campaignsData?.campaigns ?? [];
    return list.some((campaign) => campaign?.isFeatured === true);
  }, [campaignsData]);

  useEffect(() => {
    if (hasFeaturedCampaign && featured) {
      setFeatured(false);
    }
  }, [hasFeaturedCampaign, featured]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addPackage = () => {
    setPackages((prev) => [
      ...prev,
      { id: Date.now(), name: "", quantity: "", price: "" },
    ]);
  };

  const removePackage = (id: number) => {
    setPackages((prev) => prev.filter((p) => p.id !== id));
  };

  const updatePackage = (id: number, field: keyof PackageInput, value: string) => {
    setPackages((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const addCampaignMutation = useMutation({
    mutationFn: async ({ status }: { status: "Draft" | "Active" }) => {
      if (!form.title.trim() || !form.description.trim()) {
        throw new Error("Title and description are required");
      }
      if (!form.totalTickets || Number(form.totalTickets) <= 0) {
        throw new Error("Total tickets must be greater than 0");
      }
      if (!form.startDate || !form.endDate || !form.drawDate) {
        throw new Error("Start, end and draw date are required");
      }

      const end = new Date(form.endDate);
      const draw = new Date(form.drawDate);
      if (draw <= end) {
        throw new Error("Draw date must be after end date");
      }

      if (!imageFile) {
        throw new Error("Campaign image is required");
      }

      const cleanedPackages = packages
        .map((pkg) => ({
          name: pkg.name.trim(),
          ticketQuantity: Number(pkg.quantity),
          price: Number(pkg.price),
        }))
        .filter((pkg) => pkg.name && pkg.ticketQuantity > 0 && pkg.price >= 0);

      if (cleanedPackages.length === 0) {
        throw new Error("At least one valid package is required");
      }

      const payload = new FormData();
      payload.append("title", form.title.trim());
      payload.append("description", form.description.trim());
      payload.append("totalTickets", String(Number(form.totalTickets)));
      payload.append("maxFreeEntries", String(Number(form.maxFreeEntries || 1)));
      payload.append("startDate", form.startDate);
      payload.append("endDate", form.endDate);
      payload.append("drawDate", form.drawDate);
      payload.append("isFeatured", String(hasFeaturedCampaign ? false : featured));
      payload.append("status", status);
      payload.append("packages", JSON.stringify(cleanedPackages));
      payload.append("prizeImage", imageFile);

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/campaigns`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TOKEN}`,
        },
        body: payload,
      });

      const json = await res.json();
      if (!res.ok || !json?.status) {
        throw new Error(json?.message || "Failed to create campaign");
      }
      return json?.data;
    },
    onSuccess: (_, variables) => {
      toast.success(
        variables.status === "Draft"
          ? "Campaign saved as draft"
          : "Campaign published successfully"
      );
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["campaigns-feature-check"] });
      setForm({
        title: "",
        description: "",
        maxFreeEntries: "1",
        totalTickets: "",
        startDate: "",
        endDate: "",
        drawDate: "",
      });
      setPackages([{ id: 1, name: "Advantage", quantity: "5", price: "20" }]);
      setImageFile(null);
      setImagePreview(null);
      setFeatured(false);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Request failed";
      toast.error(message);
    },
  });

  const handleSaveAsDraft = () => {
    addCampaignMutation.mutate({ status: "Draft" });
  };

  const handlePublish = () => {
    addCampaignMutation.mutate({ status: "Active" });
  };

  return (
    <div className="overflow-y-auto p-0 gap-0 border border-[#2a2a2a] rounded-2xl bg-[#1c1c1c] shadow-2xl">
      <style>{`
          ::-webkit-scrollbar{width:4px}
          ::-webkit-scrollbar-track{background:#1c1c1c}
          ::-webkit-scrollbar-thumb{background:#3a3a3a;border-radius:4px}
        `}</style>

      {/* Header */}
      <div className="flex items-center justify-between px-7 pt-6 pb-5 border-b border-[#2a2a2a] sticky top-0 bg-[#1c1c1c] z-10">
        <h2 className="text-white text-lg font-bold">Add Campaign</h2>
      </div>

      {/* Form Body */}
      <div className="px-7 py-6 flex flex-col gap-5">
        {/* Row 1 — Title + Description */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              Campaign Title<span className="text-[#e05555]">*</span>
            </label>
            <input
              className={inputClass}
              placeholder="Enter a compelling title for your campaign..."
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>
              Description<span className="text-[#e05555]">*</span>
            </label>
            <input
              className={inputClass}
              placeholder="Win this amazing prize"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </div>
        </div>

        {/* Campaign Image Upload */}
        <div>
          <label className={labelClass}>Campaign Image</label>
          <label
            htmlFor="campaign-image"
            className="w-full h-[130px] border border-dashed border-[#3a3a3a] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#c9a84c] transition-colors group bg-[#222]"
          >
            {imagePreview ? (
              <Image
                width={400}
                height={300}
                src={imagePreview}
                alt="Preview"
                className="h-full w-full object-cover rounded-xl"
              />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload
                  size={22}
                  className="text-[#555] group-hover:text-[#c9a84c] transition-colors"
                />
                <span className="text-[#555] text-xs group-hover:text-[#888] transition-colors">
                  Click to upload image
                </span>
              </div>
            )}
            <input
              id="campaign-image"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </label>
        </div>

        {/* Free Ticket Limitation */}
        <div>
          <label className={labelClass}>Free Ticket Limitation</label>
          <input
            className={inputClass}
            value={form.maxFreeEntries}
            onChange={(e) => handleChange("maxFreeEntries", e.target.value)}
            placeholder="1"
          />
        </div>

        {/* Total Ticket */}
        <div>
          <label className={labelClass}>Total Ticket</label>
          <input
            className={inputClass}
            value={form.totalTickets}
            onChange={(e) => handleChange("totalTickets", e.target.value)}
            placeholder="30"
          />
        </div>

        {/* Packages */}
        <div>
          {packages.map((pkg, index) => (
            <div key={pkg.id} className="mb-3">
              {index === 0 && (
                <div className="grid grid-cols-3 gap-4 mb-1.5">
                  <label className={labelClass}>Package Name</label>
                  <label className={labelClass}>Ticket Quantity</label>
                  <label className={labelClass}>Price</label>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4 items-center">
                <input
                  className={inputClass}
                  value={pkg.name}
                  onChange={(e) => updatePackage(pkg.id, "name", e.target.value)}
                  placeholder="Advantage"
                />
                <input
                  className={inputClass}
                  value={pkg.quantity}
                  onChange={(e) => updatePackage(pkg.id, "quantity", e.target.value)}
                  placeholder="5"
                />
                <div className="flex items-center gap-2">
                  <input
                    className={inputClass}
                    value={pkg.price}
                    onChange={(e) => updatePackage(pkg.id, "price", e.target.value)}
                    placeholder="20"
                  />
                  {packages.length > 1 && (
                    <button
                      onClick={() => removePackage(pkg.id)}
                      className="text-[#e05555] hover:text-[#f06666] transition-colors flex-shrink-0"
                      type="button"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Add Package Row */}
          <div className="flex justify-end mt-2">
            <button
              onClick={addPackage}
              type="button"
              className="w-7 h-7 rounded-full bg-[#2a2a2a] border border-[#3a3a3a] flex items-center justify-center hover:bg-[#c9a84c] hover:border-[#c9a84c] transition-colors group"
            >
              <Plus size={14} className="text-[#888] group-hover:text-[#111]" />
            </button>
          </div>
        </div>

        {/* Start Date + End Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              Start Date<span className="text-[#e05555]">*</span>
            </label>
            <input
              type="date"
              className={inputClass}
              value={form.startDate}
              onChange={(e) => handleChange("startDate", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>
              End Date<span className="text-[#e05555]">*</span>
            </label>
            <input
              type="date"
              className={inputClass}
              value={form.endDate}
              onChange={(e) => handleChange("endDate", e.target.value)}
            />
          </div>
        </div>

        {/* Draw Date */}
        <div>
          <label className={labelClass}>
            Draw Date<span className="text-[#e05555]">*</span>
          </label>
          <input
            type="date"
            className={inputClass}
            value={form.drawDate}
            onChange={(e) => handleChange("drawDate", e.target.value)}
          />
          <p className="text-[#777] text-xs mt-1">Draw date must be after end date.</p>
        </div>

        {/* Feature this Campaign toggle */}
        <div className="flex items-center justify-between py-1">
          <span className="text-[#C9C9C9] text-sm font-medium">
            Feature this Campaign
          </span>
          <Switch
            checked={featured}
            onCheckedChange={setFeatured}
            disabled={hasFeaturedCampaign}
            className="data-[state=checked]:bg-[#3dba6f] data-[state=unchecked]:bg-[#3a3a3a]"
          />
        </div>
        {hasFeaturedCampaign && (
          <p className="text-[#888] text-xs -mt-2">
            A featured campaign already exists. Disable that one first to enable this.
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-1 pb-1">
          <button
            onClick={handleSaveAsDraft}
            disabled={addCampaignMutation.isPending}
            className="px-6 py-2.5 rounded-full bg-[#3dba6f] hover:bg-[#34a561] text-white text-sm font-semibold transition-colors disabled:opacity-60"
          >
            Save As Draft
          </button>
          <button
            onClick={handlePublish}
            disabled={addCampaignMutation.isPending}
            className="px-8 py-2.5 rounded-full bg-[#3dba6f] hover:bg-[#34a561] text-white text-sm font-semibold transition-colors disabled:opacity-60"
          >
            Publish
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddCampaigns;
