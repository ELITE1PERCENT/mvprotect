import { SEO } from "@/components/SEO";
import { PageTransition } from "@/lib/animations";
import { useContentBlock } from "@/hooks/useContentBlock";

export default function Legal() {
  const phoneDisplay = useContentBlock("contact.phone_display", "+33 3 82 56 10 62");
  const email = useContentBlock("contact.email", "contact@mvprotect.fr");

  return (
    <PageTransition className="flex flex-col w-full py-24 bg-background">
      <SEO 
        title="Mentions Légales" 
        description="Mentions légales de la société MV PROTECT SAS." 
      />

      <div className="container px-4 max-w-4xl mx-auto">
        <div className="mb-16 border-l-4 border-primary pl-6">
          <h1 className="text-4xl md:text-5xl font-heading font-bold uppercase tracking-widest text-foreground">Mentions <span className="text-gradient-chrome">Légales</span></h1>
        </div>
        
        <div className="bg-card border-2 border-border p-8 md:p-12 shadow-xl font-sans">
          <div className="prose prose-lg max-w-none text-muted-foreground prose-headings:font-heading prose-headings:font-bold prose-headings:uppercase prose-headings:tracking-widest prose-headings:text-foreground prose-strong:text-foreground">
            <p className="lead text-xl border-b border-border pb-6 mb-8">Conformément aux dispositions de la loi n° 2004-575 du 21 juin 2004 pour la confiance en l'économie numérique, il est précisé aux utilisateurs du site MV PROTECT l'identité des différents intervenants dans le cadre de sa réalisation et de son suivi.</p>

            <h2 className="text-2xl mt-12 mb-6 flex items-center gap-3"><span className="w-2 h-2 bg-primary"></span> Édition du site</h2>
            <p>Le présent site est édité par :</p>
            <ul className="list-none pl-0 space-y-3 bg-background p-6 border border-border">
              <li><strong className="text-primary mr-2 uppercase text-sm tracking-wider">Raison sociale :</strong> MV PROTECT</li>
              <li><strong className="text-primary mr-2 uppercase text-sm tracking-wider">Forme juridique :</strong> SAS</li>
              <li><strong className="text-primary mr-2 uppercase text-sm tracking-wider">Dirigeant :</strong> Maxime Viraud</li>
              <li><strong className="text-primary mr-2 uppercase text-sm tracking-wider">SIREN :</strong> 102 779 683</li>
              <li><strong className="text-primary mr-2 uppercase text-sm tracking-wider">SIRET :</strong> 102 779 683 00014</li>
              <li><strong className="text-primary mr-2 uppercase text-sm tracking-wider">TVA intracommunautaire :</strong> FR20102779683</li>
              <li><strong className="text-primary mr-2 uppercase text-sm tracking-wider">Date de création :</strong> 08 avril 2026</li>
              <li><strong className="text-primary mr-2 uppercase text-sm tracking-wider">Code NAF/APE :</strong> 4520A – Entretien et réparation de véhicules automobiles légers</li>
            </ul>

            <h2 className="text-2xl mt-12 mb-6 flex items-center gap-3"><span className="w-2 h-2 bg-primary"></span> Contact</h2>
            <ul className="list-none pl-0 space-y-3 bg-background p-6 border border-border">
              <li><strong className="text-primary mr-2 uppercase text-sm tracking-wider">Téléphone :</strong> {phoneDisplay}</li>
              <li><strong className="text-primary mr-2 uppercase text-sm tracking-wider">Email :</strong> {email}</li>
            </ul>

            <h2 className="text-2xl mt-12 mb-6 flex items-center gap-3"><span className="w-2 h-2 bg-primary"></span> Hébergement</h2>
            <p>Le site est hébergé par :</p>
            <ul className="list-none pl-0 space-y-3 bg-background p-6 border border-border">
              <li><strong className="text-primary mr-2 uppercase text-sm tracking-wider">Société :</strong> Replit, Inc.</li>
              <li><strong className="text-primary mr-2 uppercase text-sm tracking-wider">Adresse :</strong> 767 Bryant St. #203, San Francisco, CA 94107, USA</li>
            </ul>

            <h2 className="text-2xl mt-12 mb-6 flex items-center gap-3"><span className="w-2 h-2 bg-primary"></span> Propriété intellectuelle</h2>
            <p className="bg-background p-6 border border-border">Le contenu du site, la structure générale, les textes, les images, animées ou non, et les sons dont le site est composé sont la propriété exclusive de MV PROTECT. Toute représentation totale ou partielle de ce site et de son contenu, par quelques procédés que ce soient, sans l'autorisation préalable expresse de l'éditeur est interdite et constituerait une contrefaçon sanctionnée par les articles L.335-2 et suivants du Code de la Propriété intellectuelle.</p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
