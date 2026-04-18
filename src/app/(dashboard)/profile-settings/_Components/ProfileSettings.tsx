"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Image from "next/image";
import React, { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

export default function ProfileSettings() {
  const [form, setForm] = useState({
    fullName: "Mr Raja",
    username: "raja123",
    email: "raja123@gmail.com",
    phone: "+1 (888) 000-0000",
    dob: "15 April 2001",
    gender: "Male",
    address: "00000 Artesia Blvd, Suite A-000",
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwords, setPasswords] = useState({
    current: "",
    newPass: "",
    confirm: "",
  });
  const [showPwd, setShowPwd] = useState({ current: false, newPass: false, confirm: false });
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const session = useSession();
  const TOKEN = session?.data?.user?.accessToken;

  const { data: singleUserData } = useQuery({
    queryKey: ["singleuser"],
    enabled: !!TOKEN,
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/user/me`,
        {
          headers: {
            Authorization: `Bearer ${TOKEN}`,
          },
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to fetch profile");
      return json?.data;
    },
  });

  useEffect(() => {
    if (!singleUserData) return;
    const addr = singleUserData.address;
    const addressStr = [addr?.roadArea, addr?.cityState, addr?.country, addr?.postalCode]
      .filter(Boolean)
      .join(", ");
    setForm({
      fullName: singleUserData.name || "",
      username: singleUserData.email?.split("@")[0] || "",
      email: singleUserData.email || "",
      phone: singleUserData.phone || "",
      dob: singleUserData.dob || "",
      gender: singleUserData.gender || "",
      address: addressStr,
    });
    if (singleUserData.profileImage) {
      setAvatarSrc(singleUserData.profileImage);
    }
  }, [singleUserData]);

  // ─── Update Profile ───────────────────────────────────────────────────────
  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/user/me`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${TOKEN}`,
          },
          body: JSON.stringify({
            name: form.fullName,
            email: form.email,
            phone: form.phone,
            dob: form.dob,
            gender: form.gender,
            address: { roadArea: form.address },
          }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to update profile");
      return json;
    },
    onSuccess: () => toast.success("Profile updated successfully"),
    onError: (err: Error) => toast.error(err.message),
  });

  // ─── Update Avatar ────────────────────────────────────────────────────────
  const updateAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("profileImage", file);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/user/upload-avatar`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${TOKEN}`,
          },
          body: formData,
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to upload avatar");
      return json;
    },
    onSuccess: () => toast.success("Avatar updated successfully"),
    onError: (err: Error) => toast.error(err.message),
  });

  // ─── Change Password ──────────────────────────────────────────────────────
  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/auth/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${TOKEN}`,
          },
          body: JSON.stringify({
            oldPassword: passwords.current,
            newPassword: passwords.newPass,
          }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to change password");
      return json;
    },
    onSuccess: () => {
      toast.success("Password changed successfully");
      setShowPasswordModal(false);
      setPasswords({ current: "", newPass: "", confirm: "" });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarSrc(URL.createObjectURL(file));
      updateAvatarMutation.mutate(file);
    }
  };

  const handleChangePassword = () => {
    if (!passwords.current || !passwords.newPass || !passwords.confirm) {
      toast.error("Please fill in all password fields");
      return;
    }
    if (passwords.newPass !== passwords.confirm) {
      toast.error("New password and confirm password do not match");
      return;
    }
    changePasswordMutation.mutate();
  };

  const inputCls =
    "w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors";

  const EyeIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  const EyeOffIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );

  return (
    <div className="min-h-screen p-6 flex items-start justify-center">
      <div className="w-full container mx-auto">
        {/* Profile Header Card */}
        <div className="bg-[#222222] rounded-2xl px-6 py-5 mb-6 flex items-center justify-between">
          {/* Left: Avatar + username */}
          <div className="flex items-center gap-4">
            <div
              className="relative w-16 h-16 rounded-full overflow-hidden cursor-pointer border-2 border-[#3a3a3a] hover:border-yellow-500 transition-colors flex-shrink-0"
              onClick={() => fileRef.current?.click()}
            >
              {avatarSrc ? (
                <Image width={300} height={300} src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#3a3a3a] flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
              )}
              {updateAvatarMutation.isPending ? (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-400 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                </div>
              ) : (
                <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            <span className="text-gray-400 text-sm">@{form.username}</span>
          </div>

          {/* Right: Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="px-4 py-2 rounded-full border border-gray-600 text-gray-300 text-sm hover:border-gray-400 hover:text-white transition-colors"
            >
              Change Password
            </button>
            <button
              onClick={() => updateProfileMutation.mutate()}
              disabled={updateProfileMutation.isPending}
              className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-60 text-black text-sm font-semibold px-4 py-2 rounded-full transition-colors"
            >
              {updateProfileMutation.isPending ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                </svg>
              )}
              Update Profile
            </button>
          </div>
        </div>

        {/* Form Fields */}
        <div className="bg-[#222222] rounded-2xl px-6 py-6 space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Full Name</label>
            <input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="Mr Raja"
              className={inputCls}
            />
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Email</label>
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="raja123@gmail.com"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Phone Number</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 (888) 000-0000"
                className={inputCls}
              />
            </div>
          </div>

          {/* Date of Birth + Gender */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">date of Birth</label>
              <input
                value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
                placeholder="15 April 2001"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Gender</label>
              <input
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                placeholder="Male"
                className={inputCls}
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Address</label>
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="00000 Artesia Blvd, Suite A-000"
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowPasswordModal(false); }}
        >
          <div className="bg-[#2d2d2d] rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
            {/* Close */}
            <button
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Current Password</label>
                <div className="relative">
                  <input
                    type={showPwd.current ? "text" : "password"}
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    placeholder="Enter current password"
                    className={`${inputCls} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd({ ...showPwd, current: !showPwd.current })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPwd.current ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showPwd.newPass ? "text" : "password"}
                    value={passwords.newPass}
                    onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                    placeholder="Enter new password"
                    className={`${inputCls} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd({ ...showPwd, newPass: !showPwd.newPass })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPwd.newPass ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showPwd.confirm ? "text" : "password"}
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    placeholder="Confirm new password"
                    className={`${inputCls} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd({ ...showPwd, confirm: !showPwd.confirm })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPwd.confirm ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-center pt-1">
                <button
                  onClick={handleChangePassword}
                  disabled={changePasswordMutation.isPending}
                  className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-60 text-black font-semibold text-sm px-10 py-2.5 rounded-lg transition-colors"
                >
                  {changePasswordMutation.isPending && (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  )}
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
