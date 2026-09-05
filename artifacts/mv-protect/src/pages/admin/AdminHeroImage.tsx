import { useEffect, useState } from "react";
import {
  listContentBlocks,
  updateContentBlock,
  uploadFile,
  HERO_IMAGE_KEYS,
} from "@/lib/adminApi";
import { resolveContentImageUrl } from "@/lib/utils";
import { ImagePositionPicker } from "@/components/admin/ImagePositionPicker";
import { Save, Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type HeroState = {
  bgImage: string;
  bgImagePosition: string;
  mobileImage: string;
  mobileImagePosition: string;
};

const DEFAULTS: HeroState = {
  bgImage: "images/hero-bg.jpg",
  bgImagePosition: "50% 50%",
  mobileImage: "images/hero-aerial.jpg",
  mobileImagePosition: "50% 0%",
};

/** Une des 2 sections de la page : image PC, image mobile. */
type SlotKey = "bg" | "mobile";

export default function AdminHeroImage() {
  const [state, setState] = useState<HeroState>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<Record<SlotKey, boolean>>({ bg: false, mobile: false });
  const [saving, setSaving] = useState<Record<SlotKey, boolean>>({ bg: false, mobile: false });
  const { toast } = useToast();

  useEffect(() => {
    listContentBlocks()
      .then((blocks) => {
        const byKey = new Map(blocks.map((b) => [b.key, b.value]));
        setState({
          bgImage: byKey.get(HERO_IMAGE_KEYS.bgImage) ?? DEFAULTS.bgImage,
          bgImagePosition: byKey.get(HERO_IMAGE_KEYS.bgImagePosition) ?? DEFAULTS.bgImagePosition,
          mobileImage: byKey.get(HERO_IMAGE_KEYS.mobileImage) ?? DEFAULTS.mobileImage,
          mobileImagePosition: byKey.get(HERO_IMAGE_KEYS.mobileImagePosition) ?? DEFAULTS.mobileImagePosition,
        });
      })
      .catch(() => toast({ title: "Erreur de chargement", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  const handleUpload = async (slot: SlotKey, imageField: keyof HeroState, file: File) => {
    setUploading((u) => ({ ...u, [slot]: true }));
    try {
      const { servingUrl } = await uploadFile(file);
      setState((s) => ({ ...s, [imageField]: servingUrl }));
      toast({ title: "Photo uploadée — pensez à Enregistrer ✓" });
    } catch {
      toast({ title: "Erreur upload", variant: "destructive" });
    } finally {
      setUploading((u) => ({ ...u, [slot]: false }));
    }
  };

  const handleSave = async (
    slot: SlotKey,
    imageField: keyof HeroState,
    positionField: keyof HeroState,
    imageKey: string,
    positionKey: string,
  ) => {
    setSaving((s) => ({ ...s, [slot]: true }));
    try {
      await Promise.all([
        updateContentBlock(imageKey, state[imageField]),
        updateContentBlock(positionKey, state[positionField]),
      ]);
      toast({ title: "Enregistré ✓" });
    } catch {
      toast({ title: "Erreur enregistrement", variant: "destructive" });
    } finally {
      setSaving((s) => ({ ...s, [slot]: false }));
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-white/30 font-sans text-sm flex items-center gap-2">
        <Loader className="w-4 h-4 animate-spin" /> Chargement…
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <h1 className="font-heading font-bold text-xl uppercase tracking-widest text-white mb-2">
        Image d'accueil
      </h1>
      <p className="text-white/40 font-sans text-sm mb-8 leading-relaxed">
        Le hero de la page d'accueil utilise une image sur ordinateur et une image sur mobile
        et tablette (chacune plein écran). Uploadez une photo puis faites-la glisser dans le
        cadre pour choisir la zone visible, ensuite cliquez sur Enregistrer.
      </p>

      <div className="space-y-10">
        <section className="bg-[#080c14] border border-white/5 p-5">
          <ImagePositionPicker
            label="Image — PC"
            hint="Visible sur ordinateur (masquée sur mobile et tablette)."
            src={resolveContentImageUrl(state.bgImage)}
            position={state.bgImagePosition}
            aspect={16 / 10}
            uploading={uploading.bg}
            onUpload={(file) => handleUpload("bg", "bgImage", file)}
            onPositionChange={(pos) => setState((s) => ({ ...s, bgImagePosition: pos }))}
          />
          <div className="flex justify-end mt-4">
            <button
              onClick={() => handleSave("bg", "bgImage", "bgImagePosition", HERO_IMAGE_KEYS.bgImage, HERO_IMAGE_KEYS.bgImagePosition)}
              disabled={saving.bg}
              className="flex items-center gap-2 bg-[#1e6fff]/10 hover:bg-[#1e6fff] text-[#1e6fff] hover:text-white border border-[#1e6fff]/30 hover:border-[#1e6fff] font-heading font-bold uppercase tracking-wider text-xs px-4 py-2 transition-all disabled:opacity-50"
            >
              {saving.bg ? <Loader className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Enregistrer
            </button>
          </div>
        </section>

        <section className="bg-[#080c14] border border-white/5 p-5">
          <ImagePositionPicker
            label="Image hero — Mobile & tablette"
            hint="Visible en plein écran sur mobile et tablette (remplace l'image PC en dessous du format ordinateur)."
            src={resolveContentImageUrl(state.mobileImage)}
            position={state.mobileImagePosition}
            aspect={3 / 4}
            uploading={uploading.mobile}
            onUpload={(file) => handleUpload("mobile", "mobileImage", file)}
            onPositionChange={(pos) => setState((s) => ({ ...s, mobileImagePosition: pos }))}
          />
          <div className="flex justify-end mt-4">
            <button
              onClick={() => handleSave("mobile", "mobileImage", "mobileImagePosition", HERO_IMAGE_KEYS.mobileImage, HERO_IMAGE_KEYS.mobileImagePosition)}
              disabled={saving.mobile}
              className="flex items-center gap-2 bg-[#1e6fff]/10 hover:bg-[#1e6fff] text-[#1e6fff] hover:text-white border border-[#1e6fff]/30 hover:border-[#1e6fff] font-heading font-bold uppercase tracking-wider text-xs px-4 py-2 transition-all disabled:opacity-50"
            >
              {saving.mobile ? <Loader className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Enregistrer
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
