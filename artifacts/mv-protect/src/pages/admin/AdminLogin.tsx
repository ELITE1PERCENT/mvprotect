import { useState, FormEvent } from "react";
import { useLocation } from "wouter";
import { login } from "@/lib/adminApi";

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/maximeadmin/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Identifiants incorrects");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#080c14] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <span className="font-heading font-bold text-2xl tracking-widest uppercase text-white">
            MV <span className="text-[#1e6fff]">PROTECT</span>
          </span>
          <p className="text-white/40 font-sans text-sm mt-2 tracking-widest uppercase">Admin</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/60 font-sans text-xs uppercase tracking-widest mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full bg-white/5 border border-white/10 text-white font-sans text-sm px-4 py-3 focus:outline-none focus:border-[#1e6fff] transition-colors"
              placeholder="admin@mvprotect.fr"
            />
          </div>
          <div>
            <label className="block text-white/60 font-sans text-xs uppercase tracking-widest mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full bg-white/5 border border-white/10 text-white font-sans text-sm px-4 py-3 focus:outline-none focus:border-[#1e6fff] transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-400 font-sans text-sm bg-red-500/10 border border-red-500/20 px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1e6fff] hover:bg-[#1a5fe0] disabled:opacity-50 text-white font-heading font-bold uppercase tracking-widest text-sm px-6 py-4 transition-colors"
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
