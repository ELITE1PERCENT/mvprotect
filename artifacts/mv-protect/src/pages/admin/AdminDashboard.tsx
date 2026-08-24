import { useEffect, useState } from "react";
import { listRealisations, listContentBlocks, type AdminRealisation, type ContentBlock } from "@/lib/adminApi";
import { Images, FileText, CheckCircle, Clock, TrendingUp } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

type Period = "day" | "week" | "month";
type AnalyticsRow = { date: string; total: number };

function periodLabel(period: Period) {
  if (period === "day")   return "7 derniers jours";
  if (period === "week")  return "4 dernières semaines";
  return "6 derniers mois";
}

function formatDate(dateStr: string, period: Period) {
  const d = new Date(dateStr + "T12:00:00Z");
  if (period === "day")   return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });
  if (period === "week")  return `S. du ${d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`;
  return d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
}

async function fetchAnalytics(period: Period): Promise<AnalyticsRow[]> {
  const r = await fetch(`${BASE}/api/admin/analytics?period=${period}`, { credentials: "include" });
  if (!r.ok) throw new Error("analytics error");
  return r.json();
}

export default function AdminDashboard() {
  const [realisations, setRealisations] = useState<AdminRealisation[]>([]);
  const [blocks, setBlocks]             = useState<ContentBlock[]>([]);
  const [analytics, setAnalytics]       = useState<AnalyticsRow[]>([]);
  const [period, setPeriod]             = useState<Period>("day");
  const [loading, setLoading]           = useState(true);
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    Promise.all([listRealisations(), listContentBlocks()])
      .then(([r, b]) => { setRealisations(r); setBlocks(b); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setChartLoading(true);
    fetchAnalytics(period)
      .then(setAnalytics)
      .catch(() => setAnalytics([]))
      .finally(() => setChartLoading(false));
  }, [period]);

  const published  = realisations.filter((r) => r.status === "published").length;
  const drafts     = realisations.filter((r) => r.status === "draft").length;
  const totalViews = analytics.reduce((s, r) => s + r.total, 0);

  const chartData = analytics.map((r) => ({
    date:   formatDate(r.date, period),
    visites: r.total,
  }));

  const stats = [
    { label: "Réalisations publiées", value: loading ? "—" : published, icon: CheckCircle, color: "text-green-400" },
    { label: "Brouillons",            value: loading ? "—" : drafts,    icon: Clock,        color: "text-yellow-400" },
    { label: "Blocs de contenu",      value: loading ? "—" : blocks.length, icon: FileText, color: "text-blue-400" },
    { label: "Visites (période)",     value: chartLoading ? "—" : totalViews, icon: TrendingUp, color: "text-[#1e6fff]" },
  ];

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <h1 className="font-heading font-bold text-xl uppercase tracking-widest text-white mb-8">
        Tableau de bord
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[#080c14] border border-white/5 p-5">
            <Icon className={`w-5 h-5 ${color} mb-3`} />
            <p className="text-white font-heading font-bold text-2xl">{value}</p>
            <p className="text-white/40 font-sans text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Analytics chart */}
      <div className="bg-[#080c14] border border-white/5 p-6 mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="font-heading font-bold text-sm uppercase tracking-widest text-white">
              Clics par jour
            </h2>
            <p className="text-white/30 font-sans text-xs mt-1">{periodLabel(period)}</p>
          </div>
          <div className="flex gap-2">
            {(["day", "week", "month"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`font-heading text-xs uppercase tracking-wider px-3 py-1.5 border transition-colors ${
                  period === p
                    ? "border-[#1e6fff] text-[#1e6fff] bg-[#1e6fff]/10"
                    : "border-white/10 text-white/40 hover:border-white/30 hover:text-white/70"
                }`}
              >
                {p === "day" ? "Jour" : p === "week" ? "Semaine" : "Mois"}
              </button>
            ))}
          </div>
        </div>

        {chartLoading ? (
          <div className="h-52 flex items-center justify-center text-white/20 font-sans text-sm">
            Chargement…
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-52 flex items-center justify-center text-white/20 font-sans text-sm">
            Aucune donnée pour cette période.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="visitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#1e6fff" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#1e6fff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="date"
                tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11, fontFamily: "sans-serif" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11, fontFamily: "sans-serif" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#0d1220",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 0,
                  color: "#fff",
                  fontFamily: "sans-serif",
                  fontSize: 12,
                }}
                itemStyle={{ color: "#1e6fff" }}
                labelStyle={{ color: "rgba(255,255,255,0.5)", marginBottom: 4 }}
                cursor={{ stroke: "rgba(255,255,255,0.08)" }}
              />
              <Area
                type="monotone"
                dataKey="visites"
                stroke="#1e6fff"
                strokeWidth={2}
                fill="url(#visitGrad)"
                dot={false}
                activeDot={{ r: 4, fill: "#1e6fff", strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Recent réalisations */}
      <div>
        <h2 className="font-heading font-bold text-sm uppercase tracking-widest text-white/60 mb-4">
          Réalisations récentes
        </h2>
        {loading ? (
          <p className="text-white/30 font-sans text-sm">Chargement…</p>
        ) : realisations.length === 0 ? (
          <p className="text-white/30 font-sans text-sm">Aucune réalisation encore.</p>
        ) : (
          <div className="space-y-2">
            {realisations.slice(0, 6).map((r) => (
              <div key={r.id} className="flex items-center gap-4 bg-[#080c14] border border-white/5 px-5 py-4">
                <div className="w-10 h-10 bg-black/40 shrink-0 overflow-hidden">
                  <img src={r.imageUrl} alt={r.title} className="w-full h-full object-cover opacity-70" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-sans text-sm truncate">{r.title}</p>
                  <p className="text-white/30 font-sans text-xs">{r.category ?? r.service}</p>
                </div>
                <span
                  className={`shrink-0 font-sans text-xs px-2 py-1 ${
                    r.status === "published"
                      ? "bg-green-500/10 text-green-400"
                      : "bg-yellow-500/10 text-yellow-400"
                  }`}
                >
                  {r.status === "published" ? "Publié" : "Brouillon"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
