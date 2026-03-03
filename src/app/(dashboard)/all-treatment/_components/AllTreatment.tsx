"use client";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Pencil, Eye, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

type Treatment = {
  title: string;
  category: string;
  description: string;
  benefits: string[];
  id?: string | number;
};

const allDummyTreatments: Treatment[] = [
  // Page 1
  {
    id: "t1",
    title: "Testosterone",
    category: "Men HRT",
    description:
      "A proven therapy designed to restore healthy testosterone levels...",
    benefits: [
      "Improves daily energy",
      "Supports lean muscle growth",
      "Promotes hormonal stability",
      "Enhances libido and performance",
      "Long-term vitality support",
    ],
  },
  {
    id: "e1",
    title: "Enclomiphene",
    category: "Men HRT",
    description: "A non-injection, oral solution that encourages your body...",
    benefits: [
      "Encourages natural testosterone production",
      "Helps protect fertility",
      "Daily oral dosing",
      "Improves mental clarity",
      "No injections required",
    ],
  },
  {
    id: "th1",
    title: "TRT + HCG",
    category: "Men HRT",
    description:
      "A complete hormone optimization plan combining TRT with HCG...",
    benefits: [
      "Balanced testosterone optimization",
      "Fertility-conscious approach",
      "Supports long-term hormone health",
      "Maintains natural function",
      "Comprehensive care plan",
    ],
  },
  // Page 2
  {
    id: "t2",
    title: "Testosterone Plus",
    category: "Men HRT Advanced",
    description: "Enhanced version with additional support compounds...",
    benefits: ["Higher potency", "Faster results", "Extended release"],
  },
  {
    id: "e2",
    title: "Enclomiphene Max",
    category: "Men HRT",
    description: "Higher dosage oral enclomiphene option...",
    benefits: ["Stronger stimulation", "Better LH/FSH response"],
  },
  // Page 3
  {
    id: "th2",
    title: "TRT + HCG Pro",
    category: "Men HRT Premium",
    description: "Professional grade protocol with monitoring...",
    benefits: ["Advanced tracking", "Custom dosing", "Priority support"],
  },
];

const ITEMS_PER_PAGE = 3;

export default function AllTreatments() {
  const [currentPage, setCurrentPage] = useState(1);

  const totalItems = allDummyTreatments.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = allDummyTreatments.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <section className="py-12 md:py-16 lg:py-20">
      <div className="">
        <div className="text-center mb-10 md:mb-14">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
            All Treatments
          </h2>
          <p className="mt-3 text-muted-foreground md:text-lg max-w-2xl mx-auto">
            Choose the right hormone optimization approach for your goals
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8 min-h-[400px]">
          {currentItems.map((treatment) => (
            <Card
              key={treatment.id}
              className="group relative flex flex-col transition-all hover:shadow-xl overflow-hidden border"
            >
              <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-white/90 backdrop-blur-md shadow-md px-2 py-1.5 rounded-full border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Link href={`/treatments/edit/${treatment.id}`}>
                  <button
                    title="Edit"
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-blue-50 transition-colors"
                  >
                    <Pencil size={14} className="text-blue-600" />
                  </button>
                </Link>

                <Link href={`/treatments/view/${treatment.id}`}>
                  <button
                    title="View"
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-indigo-50 transition-colors"
                  >
                    <Eye size={14} className="text-indigo-600" />
                  </button>
                </Link>

                <button
                  title="Delete"
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors"
                  onClick={() => {
                    if (confirm(`Delete "${treatment.title}"?`)) {
                      console.log("Delete:", treatment.id);
                      // your delete logic here
                    }
                  }}
                >
                  <Trash2 size={14} className="text-red-500" />
                </button>
              </div>

              <CardHeader className="pb-4">
                <div className="flex items-center justify-between gap-3 pr-28">
                  <CardTitle className="text-2xl">{treatment.title}</CardTitle>
                </div>
                <CardDescription className="pt-2 text-base leading-relaxed">
                  {treatment.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 pb-6">
                <ul className="space-y-2.5 text-sm">
                  {treatment.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-green-600 text-base mt-0.5">✔</span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Manual Pagination ── */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
            {/* Showing range info */}
            {totalItems > 0 && (
              <div className="text-sm text-gray-500">
                Showing {startIndex + 1}–
                {Math.min(startIndex + ITEMS_PER_PAGE, totalItems)} of{" "}
                {totalItems}
              </div>
            )}

            {/* Page Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              {/* Previous */}
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`flex items-center justify-center h-10 w-10 rounded-md border transition-colors duration-200 ${
                  currentPage === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 active:bg-gray-100"
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Page numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`flex items-center justify-center h-10 w-10 rounded-md border text-sm font-medium transition-all duration-200 ${
                      page === currentPage
                        ? "bg-blue-600 text-white border-blue-600 font-semibold shadow-sm"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 active:bg-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}

              {/* Next */}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`flex items-center justify-center h-10 w-10 rounded-md border transition-colors duration-200 ${
                  currentPage === totalPages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 active:bg-gray-100"
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
