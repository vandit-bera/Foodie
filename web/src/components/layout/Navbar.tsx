"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Search, PlusSquare, User, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useLogout } from "@/lib/hooks/useAuth";
import { clsx } from "clsx";

const NAV_ITEMS = [
  { href: "/",        icon: Home,       label: "Home" },
  { href: "/search",  icon: Search,     label: "Search" },
  { href: "/create",  icon: PlusSquare, label: "Post" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const logout = useLogout();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <>
      {/* Desktop top nav */}
      <header className="hidden md:flex sticky top-0 z-40 bg-white border-b border-gray-100 px-6 py-3 items-center justify-between shadow-sm">
        <Link href="/" className="text-2xl font-bold text-brand-500">🍜 Foodie</Link>

        <nav className="flex gap-6 items-center text-sm font-medium">
          {NAV_ITEMS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                "hover:text-brand-500 transition-colors",
                pathname === href ? "text-brand-500" : "text-gray-600"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex gap-3 items-center">
          {isAuthenticated ? (
            <>
              <Link
                href={`/profile/${user?.id}`}
                className="text-sm font-medium text-gray-700 hover:text-brand-500"
              >
                {user?.username}
              </Link>
              <button onClick={handleLogout} className="btn-ghost text-sm flex items-center gap-1">
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost text-sm">Login</Link>
              <Link href="/signup" className="btn-primary text-sm">Sign up</Link>
            </>
          )}
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 flex justify-around py-2 shadow-lg">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-colors",
              pathname === href ? "text-brand-500" : "text-gray-500"
            )}
          >
            <Icon size={22} />
            <span className="text-xs">{label}</span>
          </Link>
        ))}
        {isAuthenticated ? (
          <Link
            href={`/profile/${user?.id}`}
            className={clsx(
              "flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-colors",
              pathname.startsWith("/profile") ? "text-brand-500" : "text-gray-500"
            )}
          >
            <User size={22} />
            <span className="text-xs">Profile</span>
          </Link>
        ) : (
          <Link
            href="/login"
            className="flex flex-col items-center gap-1 px-4 py-1 text-gray-500"
          >
            <User size={22} />
            <span className="text-xs">Login</span>
          </Link>
        )}
      </nav>
    </>
  );
}
