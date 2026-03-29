"use client";
import { useForm } from "react-hook-form";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2, Camera } from "lucide-react";
import Image from "next/image";
import { buildMediaUrl } from "@/lib/utils";
import Link from "next/link";

interface FormData {
  username: string;
  full_name: string;
  bio: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, updateUser } = useAuthStore();
  const { register, handleSubmit } = useForm<FormData>({
    defaultValues: {
      username: user?.username ?? "",
      full_name: user?.full_name ?? "",
      bio: user?.bio ?? "",
    },
  });
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isAuthenticated || !user) {
    return (
      <div className="text-center py-20">
        <Link href="/login" className="btn-primary">Login</Link>
      </div>
    );
  }

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const { data: updated } = await api.patch("/users/me", data);
      updateUser(updated);
      toast.success("Profile updated!");
      router.push(`/profile/${user.id}`);
    } catch (e: any) {
      toast.error(e.response?.data?.detail ?? "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    try {
      const { data } = await api.post("/users/me/avatar", form);
      updateUser({ avatar_url: data.avatar_url });
      toast.success("Avatar updated!");
    } catch {
      toast.error("Failed to upload avatar");
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>

      {/* Avatar */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-brand-100 flex items-center justify-center overflow-hidden">
            {user.avatar_url ? (
              <Image src={buildMediaUrl(user.avatar_url)} alt={user.username} width={96} height={96} className="object-cover" />
            ) : (
              <span className="text-brand-500 font-bold text-3xl">{user.username[0].toUpperCase()}</span>
            )}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-0 right-0 bg-brand-500 text-white p-1.5 rounded-full"
          >
            <Camera size={14} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Username</label>
          <input {...register("username")} className="input" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Full name</label>
          <input {...register("full_name")} className="input" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Bio</label>
          <textarea {...register("bio")} rows={3} className="input resize-none" placeholder="Tell people about yourself..." />
        </div>
        <button type="submit" disabled={saving} className="btn-primary flex items-center justify-center gap-2">
          {saving && <Loader2 size={16} className="animate-spin" />}
          Save changes
        </button>
      </form>
    </div>
  );
}
