import { useEffect, useState, useRef } from "react";
import { webpUrl } from "@/lib/utils";
import {
  listRealisations,
  createRealisation,
  updateRealisation,
  deleteRealisation,
  addRealisationImage,
  deleteRealisationImage,
  reorderRealisationImages,
  toggleFeaturedHome,
  uploadFile,
  type AdminRealisation,
  type RealisationImage,
} from "@/lib/adminApi";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, Pencil, Trash2, Upload, X, Check, Loader, Images, GripVertical, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/** Enum values must match the API Zod schema */
const SERVICES = [
  { value: "nettoyage", label: "Nettoyage" },
  { value: "polissage", label: "Polissage & Céramique" },
  { value: "ppf",       label: "PPF" },
  { value: "covering",  label: "Covering" },
] as const;
const STATUS_OPTIONS = [
  { value: "published", label: "Publié" },
  { value: "draft", label: "Brouillon" },
];

type FormData = {
  title: string;
  description: string;
  category: string;
  service: string;
  vehicle: string;
  imageUrl: string;
  sortOrder: number;
  status: string;
};

const emptyForm: FormData = {
  title: "",
  description: "",
  category: "",
  service: "",
  vehicle: "",
  imageUrl: "",
  sortOrder: 0,
  status: "published",
};

/** Sortable thumbnail used inside the extra-photos grid */
function SortableImage({
  img,
  onDelete,
}: {
  img: RealisationImage;
  onDelete: (img: RealisationImage) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: img.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    cursor: "grab",
  };

  return (
    <div ref={setNodeRef} style={style} className="relative aspect-square group">
      {/* drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 z-10 bg-black/60 p-0.5 text-white/40 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="w-3 h-3" />
      </div>
      <img src={webpUrl(img.url)} alt="" className="w-full h-full object-cover opacity-80 pointer-events-none select-none" />
      <button
        type="button"
        onClick={() => onDelete(img)}
        className="absolute top-1 right-1 bg-black/70 p-0.5 text-white/60 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function AdminRealisations() {
  const [items, setItems] = useState<AdminRealisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdminRealisation | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [uploadingExtra, setUploadingExtra] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingFeatured, setTogglingFeatured] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  // Extra images: for editing = attached images, for creating = pending URLs
  const [extraImages, setExtraImages] = useState<RealisationImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const extraFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const load = () => {
    setLoading(true);
    listRealisations()
      .then(setItems)
      .catch(() => toast({ title: "Erreur de chargement", variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setExtraImages([]);
    setShowForm(true);
  };

  const openEdit = (r: AdminRealisation) => {
    setEditing(r);
    setForm({
      title: r.title,
      description: r.description,
      category: r.category ?? "",
      service: r.service,
      vehicle: r.vehicle ?? "",
      imageUrl: r.imageUrl,
      sortOrder: r.sortOrder,
      status: r.status,
    });
    setExtraImages(r.images ?? []);
    setShowForm(true);
  };

  const handleAddExtraImage = async (file: File) => {
    setUploadingExtra(true);
    try {
      const { servingUrl } = await uploadFile(file);
      if (editing) {
        // Attach immediately
        const img = await addRealisationImage(editing.id, servingUrl);
        setExtraImages((prev) => [...prev, img]);
      } else {
        // Buffer until save
        setExtraImages((prev) => [...prev, { id: -Date.now(), url: servingUrl }]);
      }
      toast({ title: "Photo ajoutée ✓" });
    } catch {
      toast({ title: "Erreur upload photo", variant: "destructive" });
    } finally {
      setUploadingExtra(false);
    }
  };

  const handleDeleteExtraImage = async (img: RealisationImage) => {
    if (editing && img.id > 0) {
      try {
        await deleteRealisationImage(editing.id, img.id);
      } catch {
        toast({ title: "Erreur suppression", variant: "destructive" });
        return;
      }
    }
    setExtraImages((prev) => prev.filter((i) => i.id !== img.id));
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = extraImages.findIndex((i) => i.id === active.id);
    const newIndex = extraImages.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(extraImages, oldIndex, newIndex);
    setExtraImages(reordered);
    // Persist immediately when editing an existing realisation
    if (editing) {
      try {
        await reorderRealisationImages(
          editing.id,
          reordered.map((img, idx) => ({ id: img.id, sortOrder: idx })),
        );
      } catch {
        toast({ title: "Erreur de réorganisation", variant: "destructive" });
      }
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const { servingUrl } = await uploadFile(file);
      setForm((f) => ({ ...f, imageUrl: servingUrl }));
      toast({ title: "Image uploadée ✓" });
    } catch {
      toast({ title: "Erreur upload", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title || !form.imageUrl || !form.description) {
      toast({ title: "Titre, image et description requis", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        category: form.category || null,
        service: form.service || "nettoyage",
        vehicle: form.vehicle || null,
        imageUrl: form.imageUrl,
        sortOrder: form.sortOrder,
        status: form.status,
        featuredHome: editing?.featuredHome ?? false,
        images: [],
      };
      if (editing) {
        await updateRealisation(editing.id, payload);
        toast({ title: "Réalisation mise à jour ✓" });
      } else {
        const created = await createRealisation(payload as Omit<AdminRealisation, "id">);
        // Attach pending extra images in sequence, preserving local order
        if (extraImages.length > 0) {
          const attached = await Promise.all(
            extraImages.map((img) => addRealisationImage(created.id, img.url)),
          );
          // Persist the drag-sorted order
          await reorderRealisationImages(
            created.id,
            attached.map((img, idx) => ({ id: img.id, sortOrder: idx })),
          );
        }
        toast({ title: "Réalisation créée ✓" });
      }
      setShowForm(false);
      load();
    } catch (err) {
      toast({ title: String(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFeatured = async (r: AdminRealisation) => {
    const featuredCount = items.filter((i) => i.featuredHome).length;
    if (!r.featuredHome && featuredCount >= 6) {
      toast({ title: "Maximum 6 réalisations en accueil", variant: "destructive" });
      return;
    }
    setTogglingFeatured(r.id);
    try {
      const updated = await toggleFeaturedHome(r.id, !r.featuredHome);
      setItems((prev) => prev.map((i) => (i.id === r.id ? { ...i, featuredHome: updated.featuredHome } : i)));
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    } finally {
      setTogglingFeatured(null);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteRealisation(id);
      toast({ title: "Réalisation supprimée" });
      setConfirmDelete(null);
      load();
    } catch {
      toast({ title: "Erreur suppression", variant: "destructive" });
    }
  };

  const filtered =
    filter === "all" ? items : items.filter((r) => r.service === filter);

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading font-bold text-xl uppercase tracking-widest text-white">
          Réalisations
        </h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#1e6fff] hover:bg-[#1a5fe0] text-white font-heading font-bold uppercase tracking-widest text-xs px-5 py-3 transition-colors"
        >
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        {[{ value: "all", label: "Toutes" }, ...SERVICES].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-4 py-2 font-sans text-xs uppercase tracking-wider transition-colors ${
              filter === value
                ? "bg-[#1e6fff] text-white"
                : "bg-white/5 text-white/50 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <p className="text-white/30 font-sans text-sm">Chargement…</p>
      ) : filtered.length === 0 ? (
        <p className="text-white/30 font-sans text-sm">Aucune réalisation dans cette catégorie.</p>
      ) : (
        <>
        {/* Counter accueil */}
        {(() => {
          const featuredCount = items.filter((i) => i.featuredHome).length;
          return (
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="font-sans text-xs text-white/30 uppercase tracking-widest">
                <Star className="w-3 h-3 inline mr-1 text-yellow-400" />
                {featuredCount}/6 affichées en accueil
              </p>
              {featuredCount === 0 && (
                <p className="font-sans text-xs text-white/20 italic">Cliquez ★ pour choisir les photos de l'accueil</p>
              )}
            </div>
          );
        })()}

        <div className="space-y-2">
          {filtered.map((r) => (
            <div key={r.id} className="flex items-center gap-4 bg-[#080c14] border border-white/5 px-5 py-4 group">
              <div className="w-14 h-14 bg-black/40 shrink-0 overflow-hidden">
                <img src={webpUrl(r.imageUrl)} alt={r.title} className="w-full h-full object-cover opacity-80" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-sans text-sm font-medium truncate">{r.title}</p>
                <p className="text-white/30 font-sans text-xs mt-0.5">
                  {r.category ?? r.service} {r.vehicle ? `· ${r.vehicle}` : ""}
                </p>
              </div>
              <span className={`shrink-0 font-sans text-xs px-2 py-1 ${r.status === "published" ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                {r.status === "published" ? "Publié" : "Brouillon"}
              </span>
              <div className="flex gap-2 shrink-0">
                {/* Toggle accueil */}
                <button
                  title={r.featuredHome ? "Retirer de l'accueil" : "Afficher en accueil"}
                  onClick={() => handleToggleFeatured(r)}
                  disabled={togglingFeatured === r.id}
                  className={`p-2 transition-colors ${r.featuredHome ? "text-yellow-400 hover:text-yellow-300" : "text-white/20 hover:text-yellow-400"}`}
                >
                  {togglingFeatured === r.id
                    ? <Loader className="w-4 h-4 animate-spin" />
                    : <Star className={`w-4 h-4 ${r.featuredHome ? "fill-yellow-400" : ""}`} />
                  }
                </button>
                <button onClick={() => openEdit(r)} className="p-2 text-white/40 hover:text-white transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                {confirmDelete === r.id ? (
                  <div className="flex gap-1">
                    <button onClick={() => handleDelete(r.id)} className="p-2 text-red-400 hover:text-red-300">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setConfirmDelete(null)} className="p-2 text-white/40 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDelete(r.id)} className="p-2 text-white/40 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        </>
      )}

      {/* Form panel */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-end" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md h-full bg-[#080c14] border-l border-white/5 overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading font-bold text-sm uppercase tracking-widest text-white">
                {editing ? "Modifier" : "Ajouter"} une réalisation
              </h2>
              <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Image upload */}
              <div>
                <label className="block text-white/60 font-sans text-xs uppercase tracking-widest mb-2">Image</label>
                {form.imageUrl ? (
                  <div className="relative group">
                    <img src={webpUrl(form.imageUrl)} alt="" className="w-full h-40 object-cover" />
                    <button
                      onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))}
                      className="absolute top-2 right-2 bg-black/60 p-1 text-white/60 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full h-32 border border-dashed border-white/10 hover:border-[#1e6fff]/50 flex flex-col items-center justify-center gap-2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {uploading ? <Loader className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                    <span className="font-sans text-xs">{uploading ? "Upload en cours…" : "Cliquer pour uploader"}</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-white/60 font-sans text-xs uppercase tracking-widest mb-2">Titre *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 text-white font-sans text-sm px-3 py-2.5 focus:outline-none focus:border-[#1e6fff]"
                  placeholder="Ex: Porsche 911 – PPF Full Body"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-white/60 font-sans text-xs uppercase tracking-widest mb-2">Description *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 text-white font-sans text-sm px-3 py-2.5 focus:outline-none focus:border-[#1e6fff] resize-none"
                />
              </div>

              {/* Service / Catégorie */}
              <div>
                <label className="block text-white/60 font-sans text-xs uppercase tracking-widest mb-2">Catégorie *</label>
                <select
                  value={form.service}
                  onChange={(e) => setForm((f) => ({
                    ...f,
                    service: e.target.value,
                    category: SERVICES.find((s) => s.value === e.target.value)?.label ?? e.target.value,
                  }))}
                  className="w-full bg-white/5 border border-white/10 text-white font-sans text-sm px-3 py-2.5 focus:outline-none focus:border-[#1e6fff]"
                >
                  <option value="">— Choisir —</option>
                  {SERVICES.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Vehicle */}
              <div>
                <label className="block text-white/60 font-sans text-xs uppercase tracking-widest mb-2">Véhicule</label>
                <input
                  value={form.vehicle}
                  onChange={(e) => setForm((f) => ({ ...f, vehicle: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 text-white font-sans text-sm px-3 py-2.5 focus:outline-none focus:border-[#1e6fff]"
                  placeholder="Ex: Porsche 911 Carrera"
                />
              </div>

              {/* Sort + Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/60 font-sans text-xs uppercase tracking-widest mb-2">Ordre</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                    className="w-full bg-white/5 border border-white/10 text-white font-sans text-sm px-3 py-2.5 focus:outline-none focus:border-[#1e6fff]"
                  />
                </div>
                <div>
                  <label className="block text-white/60 font-sans text-xs uppercase tracking-widest mb-2">Statut</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 text-white font-sans text-sm px-3 py-2.5 focus:outline-none focus:border-[#1e6fff]"
                  >
                    {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Extra photos */}
              <div>
                <label className="block text-white/60 font-sans text-xs uppercase tracking-widest mb-2">
                  <span className="flex items-center gap-1.5"><Images className="w-3.5 h-3.5" /> Photos supplémentaires</span>
                </label>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={extraImages.map((i) => i.id)} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {extraImages.map((img) => (
                        <SortableImage key={img.id} img={img} onDelete={handleDeleteExtraImage} />
                      ))}
                      <button
                        type="button"
                        onClick={() => extraFileInputRef.current?.click()}
                        disabled={uploadingExtra}
                        className="aspect-square border border-dashed border-white/10 hover:border-[#1e6fff]/50 flex flex-col items-center justify-center gap-1 text-white/30 hover:text-white/60 transition-colors"
                      >
                        {uploadingExtra ? <Loader className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        <span className="font-sans text-[10px]">{uploadingExtra ? "Upload…" : "Ajouter"}</span>
                      </button>
                    </div>
                  </SortableContext>
                </DndContext>
                <input
                  ref={extraFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleAddExtraImage(e.target.files[0])}
                />
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
