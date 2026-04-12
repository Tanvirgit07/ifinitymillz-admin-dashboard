"use client";

import { useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import React, { useState } from "react";

const TICKET_NUMBERS = [
  "500",
  "13",
  "16",
  "501",
  "201",
  "115",
  "101",
  "201",
  "38",
  "107",
  "52",
  "101",
  "300",
  "100",
  "75",
  "101",
  "96",
  "115",
  "314",
  "370",
  "401",
  "419",
  "501",
  "9",
];

// ❌ Remove static winner object, dynamic state use করব
// const winner = { ... }  <-- সরিয়ে দিলাম

function SpinWheel({
  spinning,
  rotation,
  winningNumber,
}: {
  spinning: boolean;
  rotation: number;
  winningNumber: string;
}) {
  const segments = TICKET_NUMBERS.length;
  const segAngle = 360 / segments;
  const radius = 160;
  const innerRadius = 90;
  const cx = 190;
  const cy = 190;

  const polarToCartesian = (angle: number, r: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  const describeSegment = (index: number) => {
    const startAngle = index * segAngle;
    const endAngle = startAngle + segAngle;
    const outerStart = polarToCartesian(startAngle, radius);
    const outerEnd = polarToCartesian(endAngle, radius);
    const innerStart = polarToCartesian(startAngle, innerRadius);
    const innerEnd = polarToCartesian(endAngle, innerRadius);
    const largeArc = segAngle > 180 ? 1 : 0;

    return [
      `M ${innerStart.x} ${innerStart.y}`,
      `L ${outerStart.x} ${outerStart.y}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
      `L ${innerEnd.x} ${innerEnd.y}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
      "Z",
    ].join(" ");
  };

  const getTextPos = (index: number) => {
    const midAngle = index * segAngle + segAngle / 2;
    const r = (radius + innerRadius) / 2;
    return polarToCartesian(midAngle, r);
  };

  const getTextAngle = (index: number) => {
    return index * segAngle + segAngle / 2;
  };

  return (
    <div className="relative flex items-center justify-center">
      <div
        className="absolute rounded-full"
        style={{
          width: 400,
          height: 400,
          background:
            "radial-gradient(circle, rgba(201,168,76,0.15) 0%, transparent 70%)",
          filter: "blur(20px)",
        }}
      />

      <svg
        width={380}
        height={380}
        viewBox="0 0 380 380"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: spinning
            ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 1)"
            : "none",
          filter: "drop-shadow(0 0 30px rgba(201,168,76,0.4))",
        }}
      >
        <circle
          cx={cx}
          cy={cy}
          r={radius + 14}
          fill="#1a1200"
          stroke="#c9a84c"
          strokeWidth={2}
        />
        <circle
          cx={cx}
          cy={cy}
          r={radius + 8}
          fill="none"
          stroke="#8a6820"
          strokeWidth={1}
        />

        {TICKET_NUMBERS.map((num, i) => {
          const isGold = i % 2 === 0;
          return (
            <g key={i}>
              <path
                d={describeSegment(i)}
                fill={isGold ? "#c9a84c" : "#1a1200"}
                stroke="#0a0800"
                strokeWidth={1.5}
              />
              <text
                x={getTextPos(i).x}
                y={getTextPos(i).y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={9}
                fontWeight="700"
                fill={isGold ? "#1a0f00" : "#c9a84c"}
                transform={`rotate(${getTextAngle(i)}, ${getTextPos(i).x}, ${getTextPos(i).y})`}
                fontFamily="serif"
              >
                {num}
              </text>
            </g>
          );
        })}

        {TICKET_NUMBERS.map((_, i) => {
          const angle = i * segAngle;
          const pos = polarToCartesian(angle, radius + 11);
          return (
            <circle
              key={`dot-${i}`}
              cx={pos.x}
              cy={pos.y}
              r={3}
              fill="#e8c84b"
            />
          );
        })}

        <circle
          cx={cx}
          cy={cy}
          r={innerRadius - 2}
          fill="url(#innerGrad)"
          stroke="#c9a84c"
          strokeWidth={2}
        />

        <defs>
          <radialGradient id="innerGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2a1f00" />
            <stop offset="100%" stopColor="#0d0900" />
          </radialGradient>
        </defs>

        {/* ✅ Dynamic winningNumber prop থেকে দেখাচ্ছে */}
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={36}
          fontWeight="700"
          fill="#c9a84c"
          fontFamily="Georgia, serif"
          style={{ letterSpacing: "-1px" }}
        >
          {winningNumber}
        </text>

        <rect
          x={182}
          y={cy + innerRadius - 3}
          width={16}
          height={22}
          rx={4}
          fill="#c9a84c"
        />
        <rect
          x={170}
          y={cy + innerRadius + 16}
          width={40}
          height={8}
          rx={4}
          fill="#8a6820"
        />
      </svg>
    </div>
  );
}

function GenaratePage() {
  const [spinning, setSpinning] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [showWinner, setShowWinner] = useState(false);

  const session = useSession();
  const TOKEN = session?.data?.user?.accessToken;

  const params = useParams();
  const id = params?.id;

  // ✅ API response winner data রাখার জন্য state
  const [winnerData, setWinnerData] = useState<{
    winnerName: string;
    winningTicket: string;
  } | null>(null);

  // ✅ generateMutation সম্পূর্ণ করা হয়েছে
  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/campaigns/${id}/generate-winner`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${TOKEN}`,
          },
        },
      );
      const json = await res.json();
      return json.data as { winnerName: string; winningTicket: string };
    },
    onSuccess: (data) => {
      // ✅ Spin শেষ হওয়ার পর winner data set হবে (setTimeout এর সাথে sync)
      setWinnerData(data);
    },
  });

  const handleSpin = () => {
    if (spinning) return;
    setSpinning(true);
    setShowWinner(false);
    setWinnerData(null);

    const extraSpins = 5 * 360;
    const randomStop = Math.floor(Math.random() * 360);
    const newRotation = rotation + extraSpins + randomStop;
    setRotation(newRotation);

    // ✅ API call শুরু করো spin এর সাথে সাথে
    generateMutation.mutate();

    setTimeout(() => {
      setSpinning(false);
      setHasSpun(true);
      setShowWinner(true);
    }, 4200);
  };

  return (
    <div className="min-h-screen">
      <h1 className="text-white text-[24px] font-bold mb-8 leading-[120%]">
        Generate Winner
      </h1>

      <div className="flex items-start gap-8">
        {/* Left — Wheel + Button */}
        <div className="flex flex-col items-center gap-6">
          <div
            className="relative flex items-center justify-center rounded-2xl overflow-hidden"
            style={{
              width: 520,
              height: 420,
              background:
                "radial-gradient(ellipse at center, #1a1200 0%, #0d0900 60%, #080600 100%)",
              border: "1px solid #2a2200",
              boxShadow:
                "inset 0 0 60px rgba(0,0,0,0.8), 0 0 40px rgba(201,168,76,0.1)",
            }}
          >
            <div
              className="absolute top-3 left-1/2 z-10"
              style={{ transform: "translateX(-50%)" }}
            >
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "10px solid transparent",
                  borderRight: "10px solid transparent",
                  borderTop: "20px solid #e8b84b",
                  filter: "drop-shadow(0 2px 4px rgba(232,184,75,0.6))",
                }}
              />
            </div>

            {/* ✅ winningNumber prop pass করা হচ্ছে */}
            <SpinWheel
              spinning={spinning}
              rotation={rotation}
              winningNumber={winnerData?.winningTicket ?? "?"}
            />
          </div>

          <button
            onClick={handleSpin}
            disabled={spinning}
            className="w-full max-w-[440px] py-4 rounded-xl font-bold text-lg tracking-[0.3em] transition-all duration-300 disabled:cursor-not-allowed"
            style={{
              background: spinning
                ? "linear-gradient(135deg, #3a2a00, #2a1f00)"
                : "linear-gradient(135deg, #c9a84c, #8a6820, #c9a84c)",
              backgroundSize: "200% 200%",
              color: spinning ? "#c9a84c" : "#1a0f00",
              border: "1px solid #c9a84c",
              boxShadow: spinning
                ? "none"
                : "0 0 20px rgba(201,168,76,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
              letterSpacing: "0.25em",
            }}
          >
            {spinning
              ? "S P I N N I N G . . ."
              : hasSpun
                ? "S P I N  A G A I N"
                : "S P I N"}
          </button>
        </div>

        {/* Right — Winner Details */}
        <div
          className="flex-1 rounded-2xl p-8 min-h-[420px] flex flex-col justify-center"
          style={{
            background: "#161616",
            border: "1px solid #2a2a2a",
          }}
        >
          {/* ✅ showWinner এবং winnerData দুটোই check করা হচ্ছে */}
          {showWinner && winnerData ? (
            <div style={{ animation: "fadeInUp 0.5s ease forwards" }}>
              <style>{`
                @keyframes fadeInUp {
                  from { opacity: 0; transform: translateY(16px); }
                  to   { opacity: 1; transform: translateY(0); }
                }
              `}</style>

              <h2 className="text-white text-xl font-bold mb-4">
                Winner Details
              </h2>

              <div className="flex flex-col gap-3">
                <p className="text-[#C9C9C9] text-base leading-[150%]">
                  <span className="text-[#888]">Name : </span>
                  {/* ✅ API response থেকে winnerName */}
                  {winnerData.winnerName}
                </p>
                <p className="text-[#C9C9C9] text-base leading-[150%]">
                  <span className="text-[#888]">Winning Ticket : </span>
                  {/* ✅ API response থেকে winningTicket */}
                  {winnerData.winningTicket}
                </p>
              </div>

              <div
                className="mt-8 rounded-xl px-6 py-4 inline-flex items-center gap-3"
                style={{
                  background: "linear-gradient(135deg, #2a1f00, #1a1200)",
                  border: "1px solid #c9a84c",
                }}
              >
                <span className="text-[#888] text-sm">Winning Ticket</span>
                <span className="text-[#e8b84b] text-2xl font-bold font-serif">
                  {/* ✅ API response থেকে winningTicket */}#
                  {winnerData.winningTicket}
                </span>
              </div>
            </div>
          ) : showWinner && generateMutation.isPending ? (
            // ✅ Spin শেষ কিন্তু API এখনো loading
            <div className="flex flex-col items-start gap-3">
              <h2 className="text-white text-xl font-bold">Winner Details</h2>
              <p className="text-[#555] text-sm mt-2">Fetching winner...</p>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-3">
              <h2 className="text-white text-xl font-bold">Winner Details</h2>
              <p className="text-[#555] text-sm mt-2">
                Spin the wheel to generate a winner.
              </p>
              <div className="flex flex-col gap-3 mt-4 w-full">
                {[140, 200, 120].map((w, i) => (
                  <div
                    key={i}
                    className="h-4 rounded-full"
                    style={{
                      width: w,
                      background: "#222",
                      animation: `pulse 2s ease-in-out ${i * 0.3}s infinite alternate`,
                    }}
                  />
                ))}
              </div>
              <style>{`
                @keyframes pulse {
                  from { opacity: 0.3; }
                  to   { opacity: 0.7; }
                }
              `}</style>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GenaratePage;
