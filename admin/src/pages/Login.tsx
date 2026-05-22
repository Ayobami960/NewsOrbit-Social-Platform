import { useState } from "react";
import { useNavigate } from "react-router";

import toast from "react-hot-toast";
import { Radio, Eye, EyeOff } from "lucide-react";
import type { Role } from "../types";
import { useAuth } from "../context/AuthContext";

const ADMIN_ROLES: Role[] = ["super_admin", "admin", "writer"];

export default function Login() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      if (!ADMIN_ROLES.includes(user.role)) {
        toast.error("Access denied. Admin roles only.");
        return;
      }
      toast.success(`Welcome back, ${user.name.split(" ")[0]}!`);
      navigate("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen  flex items-center justify-center p-4">
      <div className="w-full max-w-95  border border-zinc-800 rounded-2xl p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-red-600/15 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
            <Radio size={22} className="text-red-500" />
          </div>
          <h1 className="font-[Playfair_Display] text-2xl font-bold  mb-1">Osun Gist</h1>
          <p className="text-[13px] text-zinc-500">Admin Portal — Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-1.5">
              Email Address
            </label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@buildnation.com"
              className="w-full px-3 py-2.5 rounded-lg border border-zinc-700 bg-zinc-800  text-sm placeholder:text-zinc-600 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 pr-10 rounded-lg border border-zinc-700 bg-zinc-800  text-sm placeholder:text-zinc-600 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
              />
              <button type="button" onClick={() => setShowPw(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-red-600 hover:bg-red-700
             text-white font-semibold rounded-lg text-sm 
             cursor-pointer transition-colors disabled:opacity-60 
              flex items-center justify-center gap-2 mt-2">
            {loading ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in…</>
            ) : "Sign In"}
          </button>
        </form>

        <p className="text-center text-xs  mt-6">
          Only admin accounts can access this portal.
        </p>
      </div>
    </div>
  );
}
