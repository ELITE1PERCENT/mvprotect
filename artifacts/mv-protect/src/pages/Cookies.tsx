import { SEO } from "@/components/SEO";
import { PageTransition } from "@/lib/animations";

export default function Cookies() {
  const openCookiePreferences = () => {
    // Reset consent to trigger banner with preferences open
    localStorage.removeItem("mvprotect-cookie-consent");
    window.location.reload();
  };

  return (
    <PageTransition className="flex flex-col w-full py-24 bg-background">
      <SEO 
        title="Politique des Cookies" 
        description="Informations concernant l'utilisation des cookies sur le site MV PROTECT." 
      />

      <div className="container px-4 max-w-4xl mx-auto">
        <div className="mb-16 border-l-4 border-primary pl-6">
          <h1 className="text-4xl md:text-5xl font-heading font-bold uppercase tracking-widest text-foreground">Politique des <span className="text-gradient-chrome">Cookies</span></h1>
        </div>
        
        <div className="bg-card border-2 border-border p-8 md:p-12 shadow-xl font-sans">
          <div className="prose prose-lg max-w-none text-muted-foreground prose-headings:font-heading prose-headings:font-bold prose-headings:uppercase prose-headings:tracking-widest prose-headings:text-foreground">
            <p className="lead text-xl border-b border-border pb-6 mb-8 text-foreground">Lors de votre navigation sur le site de MV PROTECT, des cookies peuvent être déposés sur votre terminal (ordinateur, tablette, smartphone).</p>

            <h2 className="text-2xl mt-12 mb-6 flex items-center gap-3"><span className="w-2 h-2 bg-primary"></span> Qu'est-ce qu'un cookie ?</h2>
            <p className="bg-background p-6 border border-border">Un cookie est un petit fichier texte déposé sur votre terminal lors de la visite d'un site ou de la consultation d'une publicité. Ils ont notamment pour but de collecter des informations relatives à votre navigation et de vous adresser des services personnalisés.</p>

            <h2 className="text-2xl mt-12 mb-6 flex items-center gap-3"><span className="w-2 h-2 bg-primary"></span> Les cookies que nous utilisons</h2>
            
            <div className="space-y-6">
              <div className="bg-background p-6 border border-border border-l-4 border-l-primary">
                <h3 className="text-lg font-bold text-foreground mb-2 m-0 uppercase tracking-wider">Cookies strictement nécessaires (Essentiels)</h3>
                <p className="m-0 text-sm">Ces cookies sont indispensables au fonctionnement du site et ne peuvent pas être désactivés. Ils vous permettent d'utiliser les principales fonctionnalités (par exemple : enregistrement de vos préférences de consentement).</p>
              </div>

              <div className="bg-background p-6 border border-border border-l-4 border-l-primary">
                <h3 className="text-lg font-bold text-foreground mb-2 m-0 uppercase tracking-wider">Cookies analytiques</h3>
                <p className="m-0 text-sm">Ils nous permettent de connaître l'utilisation et les performances de notre site, d'établir des statistiques, des volumes de fréquentation et d'utilisation des divers éléments composant notre site (contenus visités, parcours) afin d'en améliorer l'intérêt et l'ergonomie.</p>
              </div>

              <div className="bg-background p-6 border border-border border-l-4 border-l-primary">
                <h3 className="text-lg font-bold text-foreground mb-2 m-0 uppercase tracking-wider">Cookies marketing</h3>
                <p className="m-0 text-sm">Ces cookies peuvent être mis en place au sein de notre site web par nos partenaires publicitaires. Ils peuvent être utilisés pour établir un profil de vos intérêts et vous proposer des annonces pertinentes sur d'autres sites web.</p>
              </div>
            </div>

            <h2 className="text-2xl mt-12 mb-6 flex items-center gap-3"><span className="w-2 h-2 bg-primary"></span> Gérer vos préférences</h2>
            <p>Vous avez consenti ou refusé l'utilisation des cookies non essentiels lors de votre première visite. Vous pouvez modifier votre choix à tout moment.</p>
            
            <div className="mt-8 p-8 bg-card border-2 border-primary/30 rounded-none text-center shadow-lg">
              <p className="mb-6 font-bold text-foreground">Souhaitez-vous modifier vos paramètres de cookies ?</p>
              <button onClick={openCookiePreferences} className="px-8 py-4 text-sm btn-outline-skew">
                <span>Ouvrir le panneau de personnalisation</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
