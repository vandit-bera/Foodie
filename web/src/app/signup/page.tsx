"use client";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSignup } from "@/lib/hooks/useAuth";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

interface FormData {
  username: string;
  email: string;
  password: string;
  full_name: string;
}

export default function SignupPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
  const signupMutation = useSignup();

  const onSubmit = async (data: FormData) => {
    try {
      await signupMutation.mutateAsync(data);
      toast.success("Account created!");
      router.push("/");
    } catch (e: any) {
      toast.error(e.response?.data?.detail ?? "Sign up failed");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="card w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <span className="text-4xl">🍜</span>
          <h1 className="text-2xl font-bold mt-2">Join Foodie</h1>
          <p className="text-gray-500 text-sm mt-1">Share your food discoveries</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div>
            <input
              {...register("full_name")}
              placeholder="Full name (optional)"
              className="input"
            />
          </div>
          <div>
            <input
              {...register("username", {
                required: "Username required",
                pattern: { value: /^[a-zA-Z0-9_]{3,30}$/, message: "3–30 chars, alphanumeric + underscores" }
              })}
              placeholder="Username"
              className="input"
            />
            {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
          </div>
          <div>
            <input
              {...register("email", { required: "Email required" })}
              type="email"
              placeholder="Email"
              className="input"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <input
              {...register("password", { required: "Password required", minLength: { value: 8, message: "Min 8 characters" } })}
              type="password"
              placeholder="Password (min 8 chars)"
              className="input"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={signupMutation.isPending}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {signupMutation.isPending && <Loader2 size={16} className="animate-spin" />}
            Create account
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-500 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
