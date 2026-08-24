import { SEO } from "@/components/SEO";
import { PageTransition } from "@/lib/animations";
import { useContentBlock } from "@/hooks/useContentBlock";

export default function Privacy() {
  const email = useContentBlock("contact.email", "contact@mvprotect.fr");

  return (
    <PageTransition className="flex flex-col w-full py-24 bg-background">
      <SEO 
        title="Politique de Confidentialité" 
        description="Politique de confidentialité et traitement des données personnelles (RGPD) par MV PROTECT." 
      />

      <div className="container px-4 max-w-4xl mx-auto">
        <div className="mb-16 border-l-4 border-primary pl-6">
          <h1 className="text-4xl md:text-5xl font-heading font-bold uppercase tracking-widest text-foreground">Politique de <span className="text-gradient-chrome">Confidentialité</span></h1>
        </div>
        
        <div className="bg-card border-2 border-border p-8 md:p-12 shadow-xl font-sans">
          <div className="prose prose-lg max-w-none text-muted-foreground prose-headings:font-heading prose-headings:font-bold prose-headings:uppercase prose-headings:tracking-widest prose-headings:text-foreground prose-strong:text-foreground">
            <p className="lead text-xl border-b border-border pb-6 mb-8">MV PROTECT accorde une grande importance à la protection de vos données personnelles et s'engage à respecter les dispositions du Règlement Général sur la Protection des Données (RGPD).</p>

            <h2 className="text-2xl mt-12 mb-6 flex items-center gap-3"><span className="w-2 h-2 bg-primary"></span> 1. Données collectées</h2>
            <p>Via notre formulaire de contact/devis, nous collectons les données suivantes :</p>
            <ul className="list-none pl-0 space-y-2 bg-background p-6 border border-border">
              <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-primary/50 rotate-45"></span> Nom / Prénom</li>
              <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-primary/50 rotate-45"></span> Numéro de téléphone</li>
              <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-primary/50 rotate-45"></span> Adresse e-mail</li>
              <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-primary/50 rotate-45"></span> Message (incluant des détails sur votre véhicule)</li>
            </ul>

            <h2 className="text-2xl mt-12 mb-6 flex items-center gap-3"><span className="w-2 h-2 bg-primary"></span> 2. Finalité du traitement</h2>
            <p>Les données recueillies ont pour but exclusif de :</p>
            <ul className="list-none pl-0 space-y-2 bg-background p-6 border border-border">
              <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-primary/50 rotate-45"></span> Traiter votre demande de devis et vous recontacter.</li>
              <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-primary/50 rotate-45"></span> Vous envoyer des offres commerciales, sous réserve de votre consentement explicite.</li>
            </ul>

            <h2 className="text-2xl mt-12 mb-6 flex items-center gap-3"><span className="w-2 h-2 bg-primary"></span> 3. Base légale</h2>
            <p>Le traitement de ces données repose sur :</p>
            <ul className="list-none pl-0 space-y-3 bg-background p-6 border border-border">
              <li className="flex items-start gap-3"><span className="w-1.5 h-1.5 bg-primary/50 rotate-45 mt-2 shrink-0"></span> <span><strong className="text-primary uppercase text-sm tracking-wider mr-2">L'intérêt légitime / exécution pré-contractuelle :</strong> pour la gestion de votre demande de devis.</span></li>
              <li className="flex items-start gap-3"><span className="w-1.5 h-1.5 bg-primary/50 rotate-45 mt-2 shrink-0"></span> <span><strong className="text-primary uppercase text-sm tracking-wider mr-2">Le consentement :</strong> pour l'envoi de communications marketing.</span></li>
            </ul>

            <h2 className="text-2xl mt-12 mb-6 flex items-center gap-3"><span className="w-2 h-2 bg-primary"></span> 4. Durée de conservation</h2>
            <p className="bg-background p-6 border border-border">Vos données personnelles sont conservées pour une durée maximale de <strong>3 ans</strong> à compter de notre dernier contact.</p>

            <h2 className="text-2xl mt-12 mb-6 flex items-center gap-3"><span className="w-2 h-2 bg-primary"></span> 5. Partage des données</h2>
            <p className="bg-background p-6 border border-border">MV PROTECT est l'unique destinataire de vos données. Nous nous engageons à ne <strong>jamais vendre ni céder</strong> vos données personnelles à des tiers.</p>

            <h2 className="text-2xl mt-12 mb-6 flex items-center gap-3"><span className="w-2 h-2 bg-primary"></span> 6. Vos droits</h2>
            <p>Conformément à la réglementation, vous disposez des droits suivants concernant vos données :</p>
            <ul className="list-none pl-0 space-y-2 bg-background p-6 border border-border mb-6">
              <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-primary/50 rotate-45"></span> Droit d'accès</li>
              <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-primary/50 rotate-45"></span> Droit de rectification</li>
              <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-primary/50 rotate-45"></span> Droit à l'effacement (droit à l'oubli)</li>
              <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-primary/50 rotate-45"></span> Droit d'opposition</li>
            </ul>
            <p className="bg-background p-6 border-l-4 border-l-primary">Pour exercer ces droits, veuillez nous contacter à l'adresse email : <strong>{email}</strong>. Si vous estimez que vos droits ne sont pas respectés, vous avez la possibilité d'introduire une réclamation auprès de la CNIL.</p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
