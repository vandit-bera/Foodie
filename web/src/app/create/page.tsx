"use client";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { useEffect, useRef, useState } from "react";
import { useLocationStore } from "@/store/locationStore";
import { Upload, X, MapPin, Loader2 } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import Link from "next/link";

interface FormData {
  food_name: string;
  restaurant_name: string;
  price: string;
  caption: string;
  location_name: string;
  city: string;
}

export default function CreatePostPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { lat, lng } = useLocationStore();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>();
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Pre-fill location coords
  useEffect(() => {
    if (lat && lng) {
      // Reverse geocode (simple — in prod use a real geocoding API)
    }
  }, [lat, lng]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const picked = Array.from(files).slice(0, 5 - images.length);
    setImages((prev) => [...prev, ...picked]);
    picked.forEach((f) => {
      const url = URL.createObjectURL(f);
      setPreviews((prev) => [...prev, url]);
    });
  };

  const removeImage = (i: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const onSubmit = async (data: FormData) => {
    if (images.length === 0) { toast.error("Add at least one photo"); return; }
    setSubmitting(true);

    const form = new FormData();
    form.append("food_name", data.food_name);
    form.append("restaurant_name", data.restaurant_name);
    if (data.price) form.append("price", data.price);
    if (data.caption) form.append("caption", data.caption);
    if (data.location_name) form.append("location_name", data.location_name);
    if (data.city) form.append("city", data.city);
    if (lat) form.append("latitude", String(lat));
    if (lng) form.append("longitude", String(lng));
    images.forEach((img) => form.append("images", img));

    try {
      const { data: post } = await api.post("/posts", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Post shared!");
      router.push(`/post/${post.id}`);
    } catch (e: any) {
      toast.error(e.response?.data?.detail ?? "Failed to create post");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-4xl mb-4">🔒</p>
        <h2 className="text-xl font-bold mb-2">Login required</h2>
        <p className="text-gray-500 mb-6">You need to be logged in to share posts.</p>
        <Link href="/login" className="btn-primary">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Share a food experience</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        {/* Image upload */}
        <div>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-all"
          >
            <Upload size={28} className="mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">Click to upload photos (up to 5)</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {previews.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {previews.map((src, i) => (
                <div key={i} className="relative w-20 h-20">
                  <Image src={src} alt="" fill className="object-cover rounded-xl" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Food details */}
        <div className="card p-5 flex flex-col gap-4">
          <h2 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Food details</h2>
          <div>
            <input {...register("food_name", { required: "Food name required" })} placeholder="Food name *" className="input" />
            {errors.food_name && <p className="text-red-500 text-xs mt-1">{errors.food_name.message}</p>}
          </div>
          <div>
            <input {...register("restaurant_name", { required: "Restaurant name required" })} placeholder="Restaurant name *" className="input" />
            {errors.restaurant_name && <p className="text-red-500 text-xs mt-1">{errors.restaurant_name.message}</p>}
          </div>
          <input {...register("price")} type="number" step="0.01" placeholder="Price (optional)" className="input" />
          <textarea
            {...register("caption")}
            placeholder="Write a review or caption..."
            rows={3}
            className="input resize-none"
          />
        </div>

        {/* Location */}
        <div className="card p-5 flex flex-col gap-4">
          <h2 className="font-semibold text-sm text-gray-500 uppercase tracking-wide flex items-center gap-2">
            <MapPin size={14} /> Location
          </h2>
          <input {...register("location_name")} placeholder="Location name (e.g. Connaught Place)" className="input" />
          <input {...register("city")} placeholder="City" className="input" />
          {lat && lng && (
            <p className="text-xs text-brand-500 flex items-center gap-1">
              <MapPin size={12} /> GPS location will be attached automatically
            </p>
          )}
        </div>

        <button type="submit" disabled={submitting} className="btn-primary flex items-center justify-center gap-2 py-3 text-base">
          {submitting && <Loader2 size={18} className="animate-spin" />}
          Share post
        </button>
      </form>
    </div>
  );
}
