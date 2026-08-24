import { useEffect, useState } from "react";
import {
  listTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  type AdminTestimonial,
} from "@/lib/adminApi";
import { Plus, Pencil, Trash2, X, Check, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type FormData = {
  name: string;
  rating: number;
  comment: string;
  vehicle: string;
  source: "google" | "site";
};

const emptyForm: FormData = {
  name: "",
  rating: 5,
  comment: "",
  vehicle: "",
  source: "site",
};

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="focus:outline-none"
        >
          <Star
            className={`w-6 h-6 transition-colors ${
              star <= value ? "text-yellow-400 fill-yellow-400" : "text-white/20"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function AdminTestimonials() {
  const [items, setItems] = useState<AdminTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdminTestimonial | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const { toast } = useToast();

  const load = () => {
    setLoading(true);
    listTestimonials()
      .then(setItems)
      .catch(() => toast({ title: "Erreur de chargement", variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (t: AdminTestimonial) => {
    setEditing(t);
    setForm({
      name: t.name,
      rating: t.rating,
      comment: t.comment,
      vehicle: t.vehicle ?? "",
      source: t.source === "google" ? "google" : "site",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.comment) {
      toast({ title: "Nom et commentaire requis", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        rating: form.rating,
        comment: form.comment,
        vehicle: form.vehicle || null,
        source: form.source,
      };
      if (editing) {
        await updateTestimonial(editing.id, payload);
        toast({ title: "Témoignage mis à jour ✓" });
      } else {
        await createTestimonial(payload);
        toast({ title: "Témoignage créé ✓" });
      }
      setShowForm(false);
      load();
    } catch (err) {
      toast({ title: String(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTestimonial(id);
      toast({ title: "Témoignage supprimé" });
      setConfirmDelete(null);
      load();
    } catch {
      toast({ title: "Erreur suppression", variant: "destructive" });
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading font-bold text-xl uppercase tracking-widest text-white">
          Témoignages
        </h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#1e6fff] hover:bg-[#1a5fe0] text-white font-heading font-bold uppercase tracking-widest text-xs px-5 py-3 transition-colors"
        >
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-white/30 font-sans text-sm">Chargement…</p>
      ) : items.length === 0 ? (
        <p className="text-white/30 font-sans text-sm">Aucun témoignage pour l'instant.</p>
      ) : (
        <div className="space-y-2">
          {items.map((t) => (
            <div
              key={t.id}
              className="flex items-start gap-4 bg-[#080c14] border border-white/5 px-5 py-4 group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <p className="text-white font-sans text-sm font-medium">{t.name}</p>
                  {t.vehicle && (
                    <span className="text-white/30 font-sans text-xs">· {t.vehicle}</span>
                  )}
                  <span
                    className={`font-sans text-[10px] uppercase tracking-wider px-1.5 py-0.5 border ${
                      t.source === "google"
                        ? "border-[#1e6fff]/40 text-[#4d9fff]"
                        : "border-white/10 text-white/40"
                    }`}
                  >
                    {t.source === "google" ? "Avis Google" : "Direct"}
                  </span>
                </div>
                <div className="flex gap-0.5 mb-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${
                        s <= t.rating ? "text-yellow-400 fill-yellow-400" : "text-white/15"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-white/50 font-sans text-xs leading-relaxed line-clamp-2">
                  {t.comment}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => openEdit(t)}
                  className="p-2 text-white/40 hover:text-white transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                {confirmDelete === t.id ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="p-2 text-red-400 hover:text-red-300"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="p-2 text-white/40 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(t.id)}
                    className="p-2 text-white/40 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form panel */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-start justify-end"
          onClick={() => setShowForm(false)}
        >
          <div
            className="w-full max-w-md h-full bg-[#080c14] border-l border-white/5 overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading font-bold text-sm uppercase tracking-widest text-white">
                {editing ? "Modifier" : "Ajouter"} un témoignage
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-white/40 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-white/60 font-sans text-xs uppercase tracking-widest mb-2">
                  Nom du client *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 text-white font-sans text-sm px-3 py-2.5 focus:outline-none focus:border-[#1e6fff]"
                  placeholder="Ex: Thomas M."
                />
              </div>

              {/* Rating */}
              <div>
                <label className="block text-white/60 font-sans text-xs uppercase tracking-widest mb-2">
                  Note *
                </label>
                <StarRating
                  value={form.rating}
                  onChange={(v) => setForm((f) => ({ ...f, rating: v }))}
                />
              </div>

              {/* Comment */}
              <div>
                <label className="block text-white/60 font-sans text-xs uppercase tracking-widest mb-2">
                  Commentaire *
                </label>
                <textarea
                  value={form.comment}
                  onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 text-white font-sans text-sm px-3 py-2.5 focus:outline-none focus:border-[#1e6fff] resize-none"
                  placeholder="Témoignage du client…"
                />
              </div>

              {/* Vehicle */}
              <div>
                <label className="block text-white/60 font-sans text-xs uppercase tracking-widest mb-2">
                  Véhicule
                </label>
                <input
                  value={form.vehicle}
                  onChange={(e) => setForm((f) => ({ ...f, vehicle: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 text-white font-sans text-sm px-3 py-2.5 focus:outline-none focus:border-[#1e6fff]"
                  placeholder="Ex: BMW M3"
                />
              </div>

              {/* Source */}
              <div>
                <label className="block text-white/60 font-sans text-xs uppercase tracking-widest mb-2">
                  Source *
                </label>
                <div className="flex gap-2">
                  {(
                    [
                      ["google", "Avis Google vérifié"],
                      ["site", "Témoignage direct"],
                    ] as const
                  ).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, source: val }))}
                      className={`px-4 py-2.5 font-sans text-xs border transition-colors ${
                        form.source === val
                          ? "border-[#1e6fff] bg-[#1e6fff]/15 text-white"
                          : "border-white/10 bg-white/5 text-white/50 hover:text-white"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p className="text-white/30 font-sans text-[11px] mt-2 leading-relaxed">
                  Seuls les avis Google vérifiés apparaissent dans le hero de la
                  page d'accueil et portent le badge « Avis Google ».
                </p>
              </div>

              {/* Save */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-[#1e6fff] hover:bg-[#1a5fe0] disabled:opacity-50 text-white font-heading font-bold uppercase tracking-widest text-xs py-4 transition-colors"
              >
                {saving ? "Enregistrement…" : editing ? "Mettre à jour" : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
