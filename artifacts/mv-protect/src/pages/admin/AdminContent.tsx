import { useEffect, useState } from "react";
import {
  listContentBlocks,
  updateContentBlock,
  type ContentBlock,
} from "@/lib/adminApi";
import { Save, Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SECTION_LABELS: Record<string, string> = {
  home: "Accueil",
  services: "Services",
  ppf: "PPF",
  contact: "Contact",
  footer: "Pied de page",
};

export default function AdminContent() {
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    listContentBlocks()
      .then((b) => {
        setBlocks(b);
        const init: Record<string, string> = {};
        b.forEach((block) => { init[block.key] = block.value; });
        setValues(init);
      })
      .catch(() => toast({ title: "Erreur chargement", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (key: string) => {
    setSaving((s) => ({ ...s, [key]: true }));
    try {
      await updateContentBlock(key, values[key] ?? "");
      toast({ title: "Bloc enregistré ✓" });
    } catch {
      toast({ title: "Erreur enregistrement", variant: "destructive" });
    } finally {
      setSaving((s) => ({ ...s, [key]: false }));
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-white/30 font-sans text-sm flex items-center gap-2">
        <Loader className="w-4 h-4 animate-spin" /> Chargement…
      </div>
    );
  }

  if (blocks.length === 0) {
    return (
      <div className="p-8">
        <h1 className="font-heading font-bold text-xl uppercase tracking-widest text-white mb-4">Contenus</h1>
        <p className="text-white/30 font-sans text-sm">
          Aucun bloc de contenu disponible pour l'instant. Les blocs apparaissent après le premier démarrage du serveur.
        </p>
      </div>
    );
  }

  // Group by section
  const sections = [...new Set(blocks.map((b) => b.section))];

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <h1 className="font-heading font-bold text-xl uppercase tracking-widest text-white mb-8">
        Contenus éditables
      </h1>

      <div className="space-y-10">
        {sections.map((section) => (
          <div key={section}>
            <h2 className="font-heading font-bold text-xs uppercase tracking-widest text-[#1e6fff] mb-4 pb-2 border-b border-white/5">
              {SECTION_LABELS[section] ?? section}
            </h2>
            <div className="space-y-5">
              {blocks
                .filter((b) => b.section === section)
                .map((block) => {
                  const isMultiline = (block.value?.length ?? 0) > 80;
                  return (
                    <div key={block.key} className="bg-[#080c14] border border-white/5 p-5">
                      <label className="block text-white/60 font-sans text-xs uppercase tracking-widest mb-3">
                        {block.label}
                      </label>
                      {isMultiline ? (
                        <textarea
                          value={values[block.key] ?? ""}
                          onChange={(e) => setValues((v) => ({ ...v, [block.key]: e.target.value }))}
                          rows={4}
                          className="w-full bg-white/5 border border-white/10 text-white font-sans text-sm px-3 py-2.5 focus:outline-none focus:border-[#1e6fff] resize-none transition-colors"
                        />
                      ) : (
                        <input
                          value={values[block.key] ?? ""}
                          onChange={(e) => setValues((v) => ({ ...v, [block.key]: e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 text-white font-sans text-sm px-3 py-2.5 focus:outline-none focus:border-[#1e6fff] transition-colors"
                        />
                      )}
                      <div className="flex justify-end mt-3">
                        <button
                          onClick={() => handleSave(block.key)}
                          disabled={saving[block.key]}
                          className="flex items-center gap-2 bg-[#1e6fff]/10 hover:bg-[#1e6fff] text-[#1e6fff] hover:text-white border border-[#1e6fff]/30 hover:border-[#1e6fff] font-heading font-bold uppercase tracking-wider text-xs px-4 py-2 transition-all disabled:opacity-50"
                        >
                          {saving[block.key] ? <Loader className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                          Enregistrer
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
