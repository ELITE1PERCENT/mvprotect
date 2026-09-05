/**
 * Seed idempotent lancé au démarrage du serveur.
 * N'insère que les articles manquants (comparaison par slug).
 */
import { db, pool, articlesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

/**
 * Migrations de schéma idempotentes (ADD COLUMN IF NOT EXISTS).
 * S'exécutent avant le seed pour garantir la cohérence en production
 * et dans tout environnement qui n'aurait pas encore la colonne.
 */
async function runMigrations(): Promise<void> {
  await pool.query(`
    ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0
  `);
  await pool.query(`
    ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()
  `);
  // Trigger: update updated_at only when editorial content changes.
  // View-count increments must NOT advance updated_at — Google uses
  // dateModified to decide whether to re-crawl, so spurious changes
  // dilute the signal.
  await pool.query(`
    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER LANGUAGE plpgsql AS $$
    BEGIN
      IF (NEW.title        IS DISTINCT FROM OLD.title        OR
          NEW.excerpt      IS DISTINCT FROM OLD.excerpt      OR
          NEW.content      IS DISTINCT FROM OLD.content      OR
          NEW.cover_image_url IS DISTINCT FROM OLD.cover_image_url) THEN
        NEW.updated_at = now();
      END IF;
      RETURN NEW;
    END;
    $$
  `);
  await pool.query(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'articles_set_updated_at'
      ) THEN
        CREATE TRIGGER articles_set_updated_at
        BEFORE UPDATE ON articles
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
      END IF;
    END $$
  `);
  // Persistent view-dedup store: survives server restarts and deployments.
  // key = sha256(ip):articleId, viewed_at = timestamp of last counted view.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS view_dedup (
      key        text PRIMARY KEY,
      viewed_at  timestamptz NOT NULL
    )
  `);
  // Index on viewed_at lets the lazy-eviction DELETE (WHERE viewed_at < cutoff)
  // run efficiently without scanning the whole table.
  await pool.query(`
    CREATE INDEX IF NOT EXISTS view_dedup_viewed_at_idx
    ON view_dedup (viewed_at)
  `);

  // ── Témoignages : colonne source (création + backfill one-shot) ────────────
  // 'google' = avis Google vérifié · 'site' = témoignage recueilli directement.
  // Le backfill ne s'exécute qu'au moment où la colonne est créée, pour ne pas
  // écraser les choix faits ensuite dans l'administration.
  await pool.query(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'testimonials' AND column_name = 'source'
      ) THEN
        ALTER TABLE testimonials ADD COLUMN source text NOT NULL DEFAULT 'site';
        UPDATE testimonials SET source = 'google'
        WHERE name IN ('Noémie P', 'Emeline Zanon');
      END IF;
    END $$
  `);

  // ── Admin: réalisations extra columns ──────────────────────────────────────
  await pool.query(`
    ALTER TABLE realisations
    ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published'
  `);
  await pool.query(`
    ALTER TABLE realisations
    ADD COLUMN IF NOT EXISTS category text
  `);
  // ── Admin: realisation_images (multi-images par réalisation) ───────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS realisation_images (
      id              serial PRIMARY KEY,
      realisation_id  integer NOT NULL REFERENCES realisations(id) ON DELETE CASCADE,
      url             text NOT NULL,
      sort_order      integer NOT NULL DEFAULT 0
    )
  `);
  // ── Admin: content_blocks (textes éditables du site) ──────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS content_blocks (
      key         text PRIMARY KEY,
      label       text NOT NULL,
      section     text NOT NULL,
      value       text NOT NULL,
      updated_at  timestamptz NOT NULL DEFAULT now()
    )
  `);
  // ── Fix: normalise service enum values saved with display labels ───────────
  await pool.query(`
    UPDATE realisations SET service = 'nettoyage' WHERE service = 'Nettoyage';
    UPDATE realisations SET service = 'polissage' WHERE service IN ('Polissage & Céramique','Polissage','polissage & céramique');
    UPDATE realisations SET service = 'ppf'       WHERE service = 'PPF';
    UPDATE realisations SET service = 'covering'  WHERE service = 'Covering';
  `);
  // ── Réalisations en vedette (page d'accueil) ──────────────────────────────
  await pool.query(`
    ALTER TABLE realisations
    ADD COLUMN IF NOT EXISTS featured_home boolean NOT NULL DEFAULT false
  `);
  // ── Analytics: page_views ──────────────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS page_views (
      id    serial PRIMARY KEY,
      path  text NOT NULL,
      date  date NOT NULL DEFAULT CURRENT_DATE,
      count int  NOT NULL DEFAULT 1,
      UNIQUE (path, date)
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS page_views_date_idx ON page_views (date DESC)
  `);
}

const ARTICLES = [
  // ── Batch 1 (10 articles originaux) ──
  {
    slug: "guide-complet-ppf-film-protection-peinture",
    title: "PPF : le guide complet du film de protection peinture",
    excerpt: "Film de protection peinture (PPF) : principe, avantages, pose, durée de vie et entretien. Tout ce qu'il faut savoir avant de protéger votre véhicule dans le Grand Est.",
    coverImageUrl: "images/article-ppf-guide.jpg",
    publishedAt: new Date("2026-06-01"),
    content: `<h2>Qu'est-ce que le PPF ?</h2><p>Le <strong>PPF</strong> (Paint Protection Film) est un film polyuréthane transparent posé sur la carrosserie. Chez <strong>MV PROTECT</strong> à <strong>Basse-Ham</strong> (Moselle, 57970), nous le posons avec précision sur toutes les marques.</p><h2>Pourquoi poser du PPF ?</h2><ul><li>Gravillons et cailloux (A31, A4, A30 en Moselle)</li><li>Insectes et résidus de bitume</li><li>Rayures de parking</li><li>Sel de déneigement, UV</li></ul><p>Le PPF <strong>s'autorépare à la chaleur</strong> : les rayures légères disparaissent seules.</p><h2>PPF brillant ou satiné ?</h2><ul><li><strong>Brillant</strong> : transparent, compatible <a href="/actualites/ceramique-sur-ppf-la-combinaison-ultime">céramique par-dessus</a></li><li><strong>Satiné</strong> : transforme une peinture brillante en finition mate</li></ul><h2>Quelle zone protéger ?</h2><ol><li>Pack Impact : capot + rétroviseurs + montants A</li><li>Pack Avant : capot + ailes + pare-choc + projecteurs</li><li>Full Body : carrosserie entière</li></ol><p>Nous intervenons pour <strong>Thionville, Metz, Luxembourg, Hayange, Yutz, Florange</strong> et toute la <strong>Moselle</strong>.</p><h2>Durée : 7 à 12 ans</h2><p><a href="/contact">Demandez un devis</a> — <a href="/ppf">notre page PPF</a>.</p>`,
  },
  {
    slug: "traitement-ceramique-tout-savoir",
    title: "Traitement céramique : tout ce qu'il faut savoir",
    excerpt: "Durée, prix, avantages, entretien : tout sur le traitement céramique automobile. MV PROTECT vous guide pour choisir la meilleure protection pour votre véhicule en Moselle.",
    coverImageUrl: "images/article-ceramique-guide.jpg",
    publishedAt: new Date("2026-06-08"),
    content: `<h2>Qu'est-ce qu'un traitement céramique ?</h2><p>Le <strong>traitement céramique</strong> (SiO₂) se lie chimiquement à la peinture pour former une couche ultra-dure, hydrophobe et brillante. Chez <strong>MV PROTECT</strong> à Basse-Ham, nous utilisons des produits professionnels de grade Premium.</p><h2>Avantages</h2><ul><li>Hydrophobie : eau, boue et insectes glissent</li><li>Résistance aux rayures légères</li><li>Protection UV</li><li>Facilité de lavage</li><li>Brillance profonde longue durée</li></ul><h2>Durée</h2><ul><li>Gamme professionnelle : 2 à 4 ans</li><li>Premium multicouche : 5 à 9 ans</li></ul><h2>Préparation indispensable</h2><ol><li>Décontamination</li><li><a href="/actualites/polissage-correction-peinture-automobile">Correction de peinture</a></li><li>Nettoyage IPA</li><li>Polymérisation 24–72 h en atelier climatisé</li></ol><p>Combinez avec un <a href="/actualites/guide-complet-ppf-film-protection-peinture">film PPF</a> : <a href="/actualites/ceramique-sur-ppf-la-combinaison-ultime">la combinaison ultime</a>.</p><p>Clients de <strong>Thionville, Metz, Luxembourg, Hayange, Yutz, Florange</strong> — <a href="/contact">devis gratuit</a>.</p>`,
  },
  {
    slug: "ceramique-sur-ppf-la-combinaison-ultime",
    title: "Céramique sur PPF : la combinaison ultime pour protéger votre voiture",
    excerpt: "Appliquer un traitement céramique par-dessus un film PPF, c'est la protection absolue pour votre carrosserie. MV PROTECT à Basse-Ham, Moselle.",
    coverImageUrl: "images/article-ceramique-ppf.jpg",
    publishedAt: new Date("2026-06-15"),
    content: `<h2>PPF + céramique : l'armure complète</h2><p>Le <a href="/actualites/guide-complet-ppf-film-protection-peinture">PPF</a> protège mécaniquement ; le <a href="/actualites/traitement-ceramique-tout-savoir">coating céramique</a> protège chimiquement. Combinés, ils forment la protection favorite des propriétaires de supercars et véhicules premium dans le <strong>Grand Est</strong>.</p><h2>Comment ça fonctionne</h2><ol><li>Pose du PPF sur les zones à risque ou full body</li><li>Polymérisation du film : 48 à 72 h</li><li>Application de la céramique par-dessus</li></ol><h2>Avantages</h2><ul><li>Protection mécanique (impacts, rayures)</li><li>Protection chimique (sel, fientes, humidité)</li><li>Hydrophobie maximale</li><li>Valeur de revente préservée</li></ul><p>Atelier <strong>MV PROTECT</strong> à <strong>Basse-Ham</strong> — <strong>Thionville, Luxembourg-Ville, Metz, Hayange, Yutz</strong>. <a href="/contact">Contactez-nous</a> — <a href="/services">nos services</a>.</p>`,
  },
  {
    slug: "polissage-correction-peinture-automobile",
    title: "Polissage automobile : corriger les rayures et retrouver une peinture parfaite",
    excerpt: "Micro-rayures, tourbillons, oxydation : le polissage professionnel restaure l'éclat de votre carrosserie. Guide complet par MV PROTECT en Moselle.",
    coverImageUrl: "images/article-polissage.jpg",
    publishedAt: new Date("2026-05-20"),
    content: `<h2>Pourquoi polir sa voiture ?</h2><p>La peinture accumule <strong>micro-rayures</strong>, <strong>tourbillons</strong> (swirl marks) et <strong>oxydation</strong>. Le polissage professionnel corrige ces défauts en abrasant légèrement le vernis.</p><h2>Étapes</h2><ol><li>Lavage et décontamination (argile + ferrique)</li><li>Mesure d'épaisseur de vernis</li><li>Correction : polish abrasif</li><li>Finition : polish fin</li><li>IPA wipe-off avant protection</li><li>Protection optionnelle : <a href="/actualites/traitement-ceramique-tout-savoir">céramique</a> ou <a href="/actualites/guide-complet-ppf-film-protection-peinture">PPF</a></li></ol><h2>Indispensable avant PPF ou céramique</h2><p>La correction est incluse dans nos formules <a href="/actualites/ceramique-sur-ppf-la-combinaison-ultime">PPF + céramique</a>.</p><p>Clients de <strong>Thionville, Metz, Luxembourg, Hayange, Amnéville, Briey, Yutz, Florange</strong>. <a href="/contact">Devis gratuit</a>.</p>`,
  },
  {
    slug: "covering-voiture-tout-savoir",
    title: "Covering voiture : changer la couleur de sa voiture sans repeindre",
    excerpt: "Wrap, covering, changement de couleur : tout ce que vous devez savoir sur l'habillage vinyle automobile. MV PROTECT en Moselle et Grand Est.",
    coverImageUrl: "images/article-covering.jpg",
    publishedAt: new Date("2026-05-10"),
    content: `<h2>C'est quoi le covering ?</h2><p>Le <strong>covering</strong> habille la carrosserie d'un film vinyle adhésif de haute qualité — réversible, personnalisable et nettement moins cher qu'une mise en peinture.</p><h2>Avantages</h2><ul><li>Réversible : s'enlève sans endommager la peinture d'origine</li><li>Des centaines de couleurs et finitions (mat, satiné, brillant, chromé, carbone)</li><li>Protection de la peinture d'origine</li><li>2 à 4 fois moins cher qu'une mise en peinture totale</li></ul><h2>Covering + céramique</h2><p>Nous recommandons un <a href="/actualites/traitement-ceramique-tout-savoir">traitement céramique</a> par-dessus pour maximiser la durabilité.</p><p><a href="/realisations">Galerie</a> — <a href="/contact">devis gratuit</a>. Voir aussi : <a href="/actualites/covering-noir-mat-voiture-tendance">covering noir mat</a>.</p>`,
  },
  {
    slug: "detailing-interieur-nettoyage-complet-voiture",
    title: "Detailing intérieur : le nettoyage complet qui redonne vie à l'habitacle",
    excerpt: "Cuir, moquette, plastiques, vitres, plafond : le detailing intérieur professionnel redonne une seconde vie à votre habitacle. MV PROTECT en Moselle.",
    coverImageUrl: "images/article-detailing-interieur.jpg",
    publishedAt: new Date("2026-05-01"),
    content: `<h2>Detailing intérieur professionnel</h2><p>Bien au-delà d'un nettoyage classique : traitement profond de chaque surface — sièges, tableau de bord, moquettes, plafond, vitres, joints de portes, aérations.</p><h2>Étapes</h2><ol><li>Aspiration complète</li><li>Dégraissage des plastiques</li><li>Shampoing moquettes et tapis (extraction)</li><li>Traitement des sièges tissu</li><li>Nettoyage et nourrissage <a href="/actualites/nettoyage-siege-cuir-entretien-cuir-voiture">sièges cuir</a></li><li>Nettoyage du plafond</li><li>Vitres et rétroviseurs</li><li>Désodorisation à l'ozone</li></ol><h2>Quand le faire ?</h2><ul><li>Achat ou revente d'un véhicule d'occasion</li><li>Après un dégât des eaux</li><li>En complément d'un <a href="/actualites/polissage-correction-peinture-automobile">polissage extérieur</a></li></ul><p>Clients de <strong>Thionville, Metz, Luxembourg, Hayange, Yutz, Florange, Amnéville</strong>. <a href="/contact">Rendez-vous</a>.</p>`,
  },
  {
    slug: "proteger-voiture-hiver-gel-sel-boue",
    title: "Comment protéger sa voiture en hiver : gel, sel et boue en Moselle",
    excerpt: "L'hiver en Moselle est rude pour votre carrosserie. Sel de déneigement, gel, boue : voici comment protéger efficacement la peinture de votre voiture.",
    coverImageUrl: "images/article-hiver-moselle.jpg",
    publishedAt: new Date("2026-04-15"),
    content: `<h2>L'hiver abîme particulièrement votre voiture</h2><p>En <strong>Moselle</strong>, le sel répandu sur l'A31, l'A4 et les routes départementales attaque chimiquement la peinture, accélère la corrosion et dégrade les joints.</p><h2>La meilleure défense</h2><p>Un <a href="/actualites/traitement-ceramique-tout-savoir">traitement céramique</a> ou un <a href="/actualites/guide-complet-ppf-film-protection-peinture">film PPF</a> appliqué en automne, avant les premiers salages.</p><h2>Conseils hivernaux</h2><ol><li>Préparation hivernale avant novembre</li><li>Lavez plus souvent en hiver</li><li>Produits pH neutres uniquement</li><li>Évitez les portiques automatiques</li><li>Traitez les jantes séparément</li></ol><h2>Après l'hiver</h2><p>Une <strong>décontamination complète</strong> + <a href="/actualites/polissage-correction-peinture-automobile">polissage</a> si nécessaire.</p><p>Clients de <strong>Yutz, Florange, Hayange, Amnéville, Briey, Longwy, Rombas, Cattenom</strong>. <a href="/contact">Rendez-vous</a>.</p>`,
  },
  {
    slug: "detailing-automobile-thionville-moselle",
    title: "Detailing automobile à Thionville et en Moselle : MV PROTECT à 10 minutes",
    excerpt: "Vous cherchez un professionnel du detailing automobile près de Thionville ? MV PROTECT est à Basse-Ham, à 10 minutes de Thionville.",
    coverImageUrl: "images/article-thionville.jpg",
    publishedAt: new Date("2026-04-01"),
    content: `<h2>Le meilleur atelier de detailing proche de Thionville</h2><p><strong>MV PROTECT</strong> est à <strong>Basse-Ham</strong>, à seulement <strong>10 minutes de Thionville</strong> (via la D918).</p><h2>Nos services</h2><ul><li><a href="/actualites/guide-complet-ppf-film-protection-peinture">Film PPF</a></li><li><a href="/actualites/traitement-ceramique-tout-savoir">Traitement céramique</a></li><li><a href="/actualites/polissage-correction-peinture-automobile">Polissage et correction</a></li><li><a href="/actualites/covering-voiture-tout-savoir">Covering vinyle</a></li><li><a href="/actualites/detailing-interieur-nettoyage-complet-voiture">Detailing intérieur</a></li></ul><h2>Communes desservies</h2><p><strong>Yutz, Terville, Florange, Hayange, Illange, Uckange, Algrange, Nilvange, Rombas, Marange-Silvange, Amnéville, Mondelange</strong>.</p><p><a href="/contact">Réservez</a> — <a href="/services">tous nos services</a>.</p>`,
  },
  {
    slug: "detailing-automobile-metz-grand-est",
    title: "Detailing automobile à Metz et dans le Grand Est : protection premium à 40 km",
    excerpt: "Vous êtes à Metz et cherchez le meilleur atelier de detailing ? MV PROTECT à Basse-Ham est à 40 km de Metz.",
    coverImageUrl: "images/article-metz.jpg",
    publishedAt: new Date("2026-03-15"),
    content: `<h2>Detailing professionnel accessible depuis Metz</h2><p>Notre atelier est accessible depuis <strong>Metz</strong> en moins de 45 minutes via l'A31 ou la N3.</p><h2>Nos services</h2><ul><li><a href="/actualites/guide-complet-ppf-film-protection-peinture">PPF</a></li><li><a href="/actualites/traitement-ceramique-tout-savoir">Céramique longue durée</a></li><li><a href="/actualites/ceramique-sur-ppf-la-combinaison-ultime">PPF + céramique</a></li><li><a href="/actualites/polissage-correction-peinture-automobile">Polissage</a></li><li><a href="/actualites/covering-voiture-tout-savoir">Covering et wrapping</a></li></ul><h2>Communes desservies</h2><p><strong>Woippy, Montigny-lès-Metz, Augny, Gandrange, Hagondange, Talange, Trémery, Jury, Plappeville, Saint-Julien-lès-Metz</strong>.</p><p><a href="/contact">Contactez-nous</a> — <a href="/realisations">nos réalisations</a>.</p>`,
  },
  {
    slug: "detailing-automobile-luxembourg-frontaliers",
    title: "Detailing automobile pour les frontaliers du Luxembourg : à 30 minutes de Basse-Ham",
    excerpt: "Vous travaillez au Luxembourg ? MV PROTECT à Basse-Ham est à 30 minutes de Luxembourg-Ville.",
    coverImageUrl: "images/article-luxembourg.jpg",
    publishedAt: new Date("2026-03-01"),
    content: `<h2>Detailing premium à 30 minutes de Luxembourg-Ville</h2><p>Notre atelier est à <strong>30 min de Luxembourg-Ville</strong>, moins de 20 min d'<strong>Esch-sur-Alzette</strong>, <strong>Differdange</strong> et <strong>Pétange</strong>.</p><h2>Pourquoi les frontaliers choisissent MV PROTECT ?</h2><ul><li>Niveau premium, tarifs français</li><li>À 5 min de la frontière franco-luxembourgeoise (Zoufftgen)</li><li>Dépôt le matin, récupération le soir</li></ul><h2>Nos prestations</h2><ul><li><a href="/actualites/guide-complet-ppf-film-protection-peinture">PPF complet</a></li><li><a href="/actualites/traitement-ceramique-tout-savoir">Céramique longue durée</a></li><li><a href="/actualites/ceramique-sur-ppf-la-combinaison-ultime">PPF + céramique</a></li><li><a href="/actualites/polissage-correction-peinture-automobile">Polissage</a></li><li><a href="/actualites/covering-voiture-tout-savoir">Covering</a></li></ul><p>A13 (E25) direction France, sortie Zoufftgen, puis Basse-Ham. <a href="/contact">Devis</a>.</p>`,
  },

  // ── Batch 2 (10 nouveaux articles) ──
  {
    slug: "nettoyage-exterieur-decontamination-voiture",
    title: "Nettoyage extérieur et décontamination : la base d'un detailing réussi",
    excerpt: "Avant tout polissage ou protection, un nettoyage extérieur approfondi et une décontamination complète sont indispensables. MV PROTECT vous explique chaque étape à Basse-Ham, Moselle.",
    coverImageUrl: "images/article-decontamination.jpg",
    publishedAt: new Date("2026-07-01"),
    content: `<h2>Pourquoi la décontamination est la première étape du detailing ?</h2><p>Un simple lavage ne suffit pas à préparer une carrosserie pour un <a href="/actualites/traitement-ceramique-tout-savoir">traitement céramique</a> ou un <a href="/actualites/guide-complet-ppf-film-protection-peinture">film PPF</a>.</p><h2>Les étapes du nettoyage extérieur professionnel</h2><ol><li><strong>Pré-rinçage haute pression</strong></li><li><strong>Décontaminant ferrique</strong> : vire au violet — signe de contamination élevée (fréquent sur l'<strong>A31 Metz–Luxembourg</strong>)</li><li><strong>Décontaminant chimique</strong> : bitume, insectes, résines — indispensable en <strong>Grand Est</strong> (Florange, Hagondange)</li><li><strong>Argile décontaminante</strong> : surface lisse comme du verre</li><li><strong>Rinçage + séchage</strong> soufflette et microfibre</li></ol><h2>Après la décontamination</h2><ul><li><a href="/actualites/polissage-correction-peinture-automobile">Polissage</a> si défauts visibles</li><li><a href="/actualites/traitement-ceramique-tout-savoir">Céramique</a> pour protection longue durée</li><li><a href="/actualites/guide-complet-ppf-film-protection-peinture">PPF</a> pour protection mécanique</li><li><a href="/actualites/ceramique-sur-ppf-la-combinaison-ultime">PPF + céramique</a> — la combinaison ultime</li></ul><p>Clients de <strong>Thionville, Metz, Luxembourg, Yutz, Florange, Hayange, Amnéville, Briey, Rombas, Uckange, Longwy, Cattenom, Esch-sur-Alzette</strong>. <a href="/contact">Devis gratuit</a> — <a href="/services">nos services</a>.</p>`,
  },
  {
    slug: "nettoyage-siege-cuir-entretien-cuir-voiture",
    title: "Nettoyage et entretien des sièges en cuir : guide complet MV PROTECT",
    excerpt: "Les sièges en cuir demandent un entretien spécifique pour rester souples et beaux. Découvrez la méthode professionnelle de MV PROTECT pour nettoyer et protéger le cuir automobile.",
    coverImageUrl: "images/article-cuir.jpg",
    publishedAt: new Date("2026-07-05"),
    content: `<h2>Le cuir : un matériau vivant qui se dégrade sans entretien</h2><p>Les sièges en cuir de vos BMW, Audi, Mercedes, Porsche ou Range Rover subissent UV, chaleur, transpiration et friction. Un siège négligé peut nécessiter une réfection à 2 000–5 000 €.</p><h2>Produits à utiliser / à éviter</h2><p><strong>À utiliser :</strong> nettoyant cuir pH neutre, conditionneur hydratant, protecteur anti-UV, microfibres douces.</p><p><strong>À éviter :</strong> produits ménagers, lingettes désinfectantes, silicones.</p><h2>Étapes professionnelles</h2><ol><li>Aspiration des coutures</li><li>Nettoyant cuir à la brosse douce</li><li>Rinçage microfibre</li><li>Séchage complet</li><li>Conditionneur en profondeur</li><li>Protection UV</li></ol><h2>Cuir perforé, Nappa, Alcantara</h2><ul><li><strong>Nappa</strong> : pH strictement neutre, séchage lent</li><li><strong>Alcantara</strong> : brossage dans le sens du poil, jamais de produit gras</li></ul><p>Inclus dans notre <a href="/actualites/detailing-interieur-nettoyage-complet-voiture">detailing intérieur complet</a>. Clients de <strong>Thionville, Metz, Luxembourg, Hayange, Yutz, Florange, Briey, Longwy, Amnéville, Sarreguemines</strong>. <a href="/contact">Rendez-vous</a>.</p>`,
  },
  {
    slug: "ppf-voiture-sport-supercar-porsche-ferrari",
    title: "PPF pour voitures de sport et supercars : protéger Porsche, Ferrari, Lamborghini",
    excerpt: "Votre Porsche, Ferrari ou Lamborghini mérite une protection absolue. Le film PPF préserve la peinture et la valeur de revente. MV PROTECT dans le Grand Est.",
    coverImageUrl: "images/article-ppf-supercar.jpg",
    publishedAt: new Date("2026-07-10"),
    content: `<h2>PPF indispensable sur une supercar</h2><p>Une <strong>Porsche 911</strong>, <strong>Ferrari Roma</strong>, <strong>Lamborghini Huracán</strong> représentent 150 000 à 400 000 €. Un éclat sur l'A31 peut provoquer un dommage irréparable. Chez <strong>MV PROTECT</strong> à <strong>Basse-Ham</strong>, nous traitons des véhicules d'exception pour des clients de <strong>Luxembourg, Metz, Thionville, Sarrebruck</strong>.</p><h2>Spécificités sur supercar</h2><ul><li>Découpe numérique sur mesure (pas de cutter sur le véhicule)</li><li>PPF mat pour peintures mates Ferrari ou Porsche</li><li>Traitement des zones cachées : bords de capot, dessous de portes</li><li><a href="/actualites/ceramique-sur-ppf-la-combinaison-ultime">Céramique sur PPF</a> pour finition miroir</li></ul><h2>Formules recommandées</h2><ol><li>Full Body PPF</li><li>PPF + céramique Full Body</li><li>PPF mat sur peinture brillante</li></ol><h2>Valeur de revente</h2><p>Une peinture originale impeccable se revend 5 à 15 % plus cher. <a href="/realisations">Galerie</a> — <a href="/contact">devis personnalisé</a> — <a href="/ppf">page PPF</a>.</p>`,
  },
  {
    slug: "ppf-suv-voiture-familiale-protection-quotidien",
    title: "PPF pour SUV et voitures familiales : protéger la peinture au quotidien",
    excerpt: "Le PPF n'est pas réservé aux supercars. SUV, monospaces et voitures familiales en bénéficient autant. MV PROTECT explique pourquoi en Moselle et Grand Est.",
    coverImageUrl: "images/article-ppf-suv.jpg",
    publishedAt: new Date("2026-07-15"),
    content: `<h2>Le PPF pour tout le monde</h2><p>Un <strong>SUV familial</strong> — Peugeot 3008, Renault Kadjar, VW Tiguan, Dacia Duster — subit plus d'agressions au quotidien qu'une supercar du week-end. Les familles de <strong>Thionville, Metz, Hayange, Yutz et Luxembourg</strong> utilisant leur véhicule 7j/7 sont les premières victimes.</p><h2>Zones les plus touchées</h2><ul><li>Capot (gravillons)</li><li>Ailes avant et rétroviseurs</li><li>Seuils de portes (chaussures, sacs)</li><li>Pare-choc arrière (chargement)</li><li>Bas de caisse</li></ul><h2>Packs adaptés aux familles</h2><ul><li><strong>Pack Essentiel</strong> : capot + ailes + rétroviseurs</li><li><strong>Pack Confort</strong> : + seuils + pare-choc arrière</li><li><strong>Pack Intégral</strong> : carrosserie complète</li></ul><h2>PPF + céramique : le combo malin</h2><p><a href="/actualites/ceramique-sur-ppf-la-combinaison-ultime">Associer céramique et PPF</a> simplifie l'entretien quotidien — la boue glisse, chaque lavage prend moitié moins de temps.</p><p>Clients de <strong>Thionville, Yutz, Terville, Florange, Hayange, Briey, Amnéville, Rombas, Longwy, Cattenom, Uckange, Mondelange</strong>. <a href="/actualites/guide-complet-ppf-film-protection-peinture">Guide PPF</a> — <a href="/contact">devis gratuit</a>.</p>`,
  },
  {
    slug: "traitement-ceramique-moto-protection-carrosserie",
    title: "Traitement céramique pour moto : protéger carénages, jantes et réservoir",
    excerpt: "Le coating céramique s'applique aussi aux motos, scooters et customs. Carénages, jantes, réservoir, cadre : MV PROTECT protège votre moto dans le Grand Est.",
    coverImageUrl: "images/article-ceramique-moto.jpg",
    publishedAt: new Date("2026-07-20"),
    content: `<h2>Pourquoi céramiser sa moto ?</h2><p>Une moto est exposée à des conditions plus difficiles qu'une voiture : pluie directe, insectes à vitesse autoroute, sel et boue hivernale.</p><h2>Surfaces à traiter</h2><ul><li><strong>Carénages</strong> : insectes et projections</li><li><strong>Réservoir</strong> : UV, carburants, frottements des genoux</li><li><strong>Jantes</strong> : pollution ferrique, sel</li><li><strong>Cadre et bras oscillant</strong> : anti-rouille</li></ul><h2>Préparation spécifique</h2><ol><li>Lavage doux pH neutre (jamais haute pression sur joints et câbles)</li><li>Décontamination chimique</li><li><a href="/actualites/polissage-correction-peinture-automobile">Polissage</a> si nécessaire</li><li>Application céramique panneau par panneau</li></ol><h2>Durée : 2 à 5 ans</h2><p>Lavage eau + shampoing pH neutre uniquement. Idéal pour l'hivernage.</p><p>Motards de <strong>Thionville, Metz, Luxembourg, Hayange, Briey, Sarreguemines, Forbach, Sarrebruck</strong>. <a href="/contact">Devis moto</a> — <a href="/actualites/traitement-ceramique-tout-savoir">guide céramique</a>.</p>`,
  },
  {
    slug: "covering-noir-mat-voiture-tendance",
    title: "Covering noir mat : le wrap tendance qui transforme votre voiture",
    excerpt: "Passer votre voiture en noir mat avec un covering vinyle : coûts, durée, entretien et exemples. MV PROTECT réalise votre transformation à Basse-Ham, Moselle.",
    coverImageUrl: "images/article-covering-noir-mat.jpg",
    publishedAt: new Date("2026-07-25"),
    content: `<h2>Le noir mat : la finition la plus demandée</h2><p>Le <strong>covering noir mat</strong> est notre demande numéro 1. Discret, élégant, intemporel — une BMW Série 3, un Audi Q5 ou une Clio recouverts de vinyle noir mat prennent une toute autre dimension.</p><h2>Avantages vs peinture</h2><ul><li>Réversible : retrouver la couleur d'origine</li><li>3 à 5 fois moins cher qu'une peinture professionnelle</li><li>2 à 4 jours de délai</li><li>Protection de la peinture d'origine</li></ul><h2>Entretien du noir mat</h2><ul><li>Eau froide ou tiède uniquement</li><li>Produits pH neutres — jamais de wax brillantisant</li><li>Microfibre douce, pas d'éponge</li><li>Pas de station automatique</li><li><a href="/actualites/traitement-ceramique-tout-savoir">Céramique mat</a> applicable par-dessus</li></ul><h2>Durée de vie : 5 à 8 ans</h2><p>Avec un vinyle premium (Avery Dennison, 3M, KPMF). <a href="/realisations">Galerie</a> — <a href="/contact">devis gratuit</a> — <a href="/actualites/covering-voiture-tout-savoir">guide covering</a>.</p>`,
  },
  {
    slug: "lettrage-vinyle-decoration-voiture-entreprise",
    title: "Lettrage et décoration vinyle : personnaliser voiture, utilitaire ou flotte",
    excerpt: "Logos, numéros, bandes décoratives, lettrage d'entreprise : le vinyle permet une personnalisation complète. MV PROTECT en Moselle.",
    coverImageUrl: "images/article-lettrage-vinyle.jpg",
    publishedAt: new Date("2026-07-28"),
    content: `<h2>Lettrage vinyle : communication et personnalisation</h2><p>Pour les entreprises de <strong>Thionville, Metz, Luxembourg et Sarrebruck</strong>, un utilitaire habillé génère des milliers d'impressions visuelles par jour.</p><h2>Types de réalisations</h2><ul><li><strong>Lettrage découpé</strong> : texte, slogan, coordonnées</li><li><strong>Impression numérique</strong> : logo couleur photo-réaliste</li><li><strong>Covering partiel + lettrage</strong> : changement de fond + message</li><li><strong>Bandes et stickers</strong> : décoratifs, numéros de course</li><li><strong>Covering complet avec branding</strong> : <a href="/actualites/covering-voiture-tout-savoir">voir le guide covering</a></li></ul><h2>Pour les flottes</h2><p>Devis dès 3 véhicules. Coordination avec votre charte graphique. Poses en séries.</p><h2>Durée</h2><ul><li>Vinyle découpé : 5 à 8 ans</li><li>Impression numérique : 3 à 5 ans</li></ul><p>Professionnels de <strong>Thionville, Metz, Luxembourg, Hayange, Briey, Longwy</strong>. <a href="/contact">Devis lettrage ou flotte</a> — <a href="/realisations">réalisations</a>.</p>`,
  },
  {
    slug: "comment-entretenir-traitement-ceramique",
    title: "Comment entretenir un traitement céramique pour le garder performant",
    excerpt: "Un coating céramique demande un entretien adapté pour rester efficace pendant des années. Produits, fréquence, erreurs à éviter : le guide complet MV PROTECT.",
    coverImageUrl: "images/article-entretien-ceramique.jpg",
    publishedAt: new Date("2026-06-27"),
    content: `<h2>Bien entretenu, un coating tient 5 à 9 ans</h2><p>Le <a href="/actualites/traitement-ceramique-tout-savoir">traitement céramique</a> reste performant avec les bons gestes.</p><h2>Lavage : la règle d'or</h2><ul><li><strong>Lavage à la main uniquement</strong> — méthode deux seaux</li><li><strong>Shampoing pH neutre</strong> (pH 6,5–7,5)</li><li><strong>Gant microfibre</strong>, jamais d'éponge</li><li><strong>Séchage immédiat</strong> à la microfibre</li><li>Toutes les 2 à 3 semaines (plus souvent en hiver avec le sel lorrain)</li></ul><h2>Booster céramique tous les 3–6 mois</h2><p>Un <strong>topper céramique</strong> sur surface propre rechargeable redonne l'hydrophobie et prolonge la durée de vie.</p><h2>Ce qui dégrade la céramique</h2><ul><li>Station de lavage à rouleaux</li><li>Produits pH élevé ou acides</li><li>Fientes d'oiseaux laissées + de 24h</li><li>Résines de pins fraîches</li></ul><h2>Water test annuel</h2><p>Eau en billes → céramique saine. Eau qui s'étale → entretien nécessaire. <a href="/contact">Contrôle et recharge céramique</a>. Voir aussi <a href="/actualites/ceramique-sur-ppf-la-combinaison-ultime">PPF + céramique</a> et <a href="/actualites/proteger-voiture-hiver-gel-sel-boue">protection hivernale</a>.</p>`,
  },
  {
    slug: "detailing-automobile-sarrebruck-sarreguemines-moselle-est",
    title: "Detailing automobile à Sarrebruck, Sarreguemines et à l'Est de la Moselle",
    excerpt: "Vous habitez près de Sarrebruck ou Sarreguemines ? MV PROTECT à Basse-Ham est votre atelier de detailing haut de gamme à moins d'une heure.",
    coverImageUrl: "images/article-sarrebruck.jpg",
    publishedAt: new Date("2026-06-20"),
    content: `<h2>Detailing professionnel depuis l'Est mosellan et la Sarre</h2><p>Depuis <strong>Sarreguemines</strong>, <strong>Forbach</strong>, <strong>Sarrebruck (Saarbrücken)</strong>, <strong>Freyming-Merlebach</strong>, <strong>Saint-Avold</strong> ou <strong>Creutzwald</strong>, notre atelier est accessible en moins d'une heure. Nous accueillons régulièrement des clients transfrontaliers français et allemands.</p><h2>Nos services</h2><ul><li><a href="/actualites/guide-complet-ppf-film-protection-peinture"><strong>PPF</strong></a> — protection anti-gravillons (A320, routes de Sarre)</li><li><a href="/actualites/traitement-ceramique-tout-savoir"><strong>Céramique</strong></a> longue durée</li><li><a href="/actualites/covering-voiture-tout-savoir"><strong>Covering</strong></a> et finitions mat/satiné</li><li><a href="/actualites/polissage-correction-peinture-automobile"><strong>Polissage</strong></a> et correction peinture</li></ul><h2>Accès</h2><p>Depuis <strong>Sarreguemines</strong> : D910 direction Thionville → Basse-Ham (~55 min). Depuis <strong>Sarrebruck</strong> : A620/A8 direction France, sortie Forbach, D910 (~1h). Adresse : <strong>4 Rue du Canal, 57970 Basse-Ham</strong>.</p><p><a href="/contact">Devis gratuit</a> — <a href="/realisations">réalisations</a>.</p>`,
  },
  {
    slug: "prix-detailing-professionnel-combien-ca-coute",
    title: "Combien coûte un detailing professionnel ? Guide des tarifs 2026",
    excerpt: "PPF, céramique, polissage, covering : quels budgets prévoir pour un detailing automobile professionnel ? MV PROTECT vous guide sur les prix pratiqués dans le Grand Est.",
    coverImageUrl: "images/article-tarifs.jpg",
    publishedAt: new Date("2026-06-10"),
    content: `<h2>Fourchettes de prix par prestation (Grand Est 2026)</h2>
<h3>Detailing intérieur</h3><ul><li>Intérieur complet tissu : <strong>150–350 €</strong></li><li>Intérieur + cuir : <strong>250–500 €</strong></li><li>Désodorisation ozone : <strong>80–150 €</strong></li></ul><p>→ <a href="/actualites/detailing-interieur-nettoyage-complet-voiture">Guide detailing intérieur</a></p>
<h3>Polissage</h3><ul><li>One step : <strong>200–400 €</strong></li><li>Correction 2 étapes : <strong>400–800 €</strong></li></ul><p>→ <a href="/actualites/polissage-correction-peinture-automobile">Guide polissage</a></p>
<h3>Céramique</h3><ul><li>1 couche : <strong>300–500 €</strong></li><li>Professionnel 2 couches : <strong>600–1 200 €</strong></li><li>Premium multicouche 9 ans : <strong>1 000–2 000 €</strong></li></ul><p>→ <a href="/actualites/traitement-ceramique-tout-savoir">Guide céramique</a></p>
<h3>Film PPF</h3><ul><li>Pack avant : <strong>1 200–2 500 €</strong></li><li>Full body petite voiture : <strong>3 000–5 000 €</strong></li><li>Full body SUV/berline : <strong>4 000–8 000 €</strong></li><li>Full body supercar : <strong>7 000–15 000 €</strong></li></ul><p>→ <a href="/actualites/guide-complet-ppf-film-protection-peinture">Guide PPF</a> — <a href="/actualites/ppf-suv-voiture-familiale-protection-quotidien">PPF SUV</a></p>
<h3>Covering vinyle</h3><ul><li>Partiel : <strong>300–800 €</strong></li><li>Complet petite voiture : <strong>1 500–2 500 €</strong></li><li>Complet berline/SUV : <strong>2 500–4 500 €</strong></li></ul><p>→ <a href="/actualites/covering-voiture-tout-savoir">Guide covering</a> — <a href="/actualites/covering-noir-mat-voiture-tendance">Covering noir mat</a></p>
<h2>Devis personnalisé à Basse-Ham</h2><p>Clients de <strong>Thionville, Metz, Luxembourg, Hayange, Yutz, Florange, Amnéville, Briey, Longwy, Sarreguemines, Forbach, Sarrebruck</strong>. <a href="/contact">Devis gratuit</a> — <a href="/tarifs">page tarifs</a>.</p>`,
  },
];


/**
 * Idempotent — met à jour cover_image_url pour chaque article par son slug.
 * Déclenché au démarrage pour migrer les anciennes images recyclées vers les
 * images spécifiques générées (article-*.jpg).
 */
async function updateArticleImages(): Promise<void> {
  const updates: { slug: string; coverImageUrl: string }[] = [
    { slug: "guide-complet-ppf-film-protection-peinture",                      coverImageUrl: "images/article-ppf-guide.jpg" },
    { slug: "traitement-ceramique-tout-savoir",                                coverImageUrl: "images/article-ceramique-guide.jpg" },
    { slug: "ceramique-sur-ppf-la-combinaison-ultime",                         coverImageUrl: "images/article-ceramique-ppf.jpg" },
    { slug: "polissage-correction-peinture-automobile",                        coverImageUrl: "images/article-polissage.jpg" },
    { slug: "covering-voiture-tout-savoir",                                    coverImageUrl: "images/article-covering.jpg" },
    { slug: "detailing-interieur-nettoyage-complet-voiture",                   coverImageUrl: "images/article-detailing-interieur.jpg" },
    { slug: "proteger-voiture-hiver-gel-sel-boue",                             coverImageUrl: "images/article-hiver-moselle.jpg" },
    { slug: "detailing-automobile-thionville-moselle",                         coverImageUrl: "images/article-thionville.jpg" },
    { slug: "detailing-automobile-metz-grand-est",                             coverImageUrl: "images/article-metz.jpg" },
    { slug: "detailing-automobile-luxembourg-frontaliers",                     coverImageUrl: "images/article-luxembourg.jpg" },
    { slug: "nettoyage-exterieur-decontamination-voiture",                     coverImageUrl: "images/article-decontamination.jpg" },
    { slug: "nettoyage-siege-cuir-entretien-cuir-voiture",                     coverImageUrl: "images/article-cuir.jpg" },
    { slug: "ppf-voiture-sport-supercar-porsche-ferrari",                      coverImageUrl: "images/article-ppf-supercar.jpg" },
    { slug: "ppf-suv-voiture-familiale-protection-quotidien",                  coverImageUrl: "images/article-ppf-suv.jpg" },
    { slug: "traitement-ceramique-moto-protection-carrosserie",                coverImageUrl: "images/article-ceramique-moto.jpg" },
    { slug: "covering-noir-mat-voiture-tendance",                              coverImageUrl: "images/article-covering-noir-mat.jpg" },
    { slug: "lettrage-vinyle-decoration-voiture-entreprise",                   coverImageUrl: "images/article-lettrage-vinyle.jpg" },
    { slug: "comment-entretenir-traitement-ceramique",                         coverImageUrl: "images/article-entretien-ceramique.jpg" },
    { slug: "detailing-automobile-sarrebruck-sarreguemines-moselle-est",       coverImageUrl: "images/article-sarrebruck.jpg" },
    { slug: "prix-detailing-professionnel-combien-ca-coute",                   coverImageUrl: "images/article-tarifs.jpg" },
  ];
  for (const { slug, coverImageUrl } of updates) {
    await pool.query(
      `UPDATE articles SET cover_image_url = $1 WHERE slug = $2 AND cover_image_url != $1`,
      [coverImageUrl, slug]
    );
  }
}

async function seedContentBlocks(): Promise<void> {
  const initial = [
    { key: "home.hero.subtitle",        label: "Accueil — sous-titre hero",            section: "home",     value: "Studio de detailing haut de gamme. Protection, correction et brillance absolue pour véhicules d'exception." },
    { key: "home.services.heading",     label: "Accueil — titre section services",     section: "home",     value: "L'ART DU SOIN AUTOMOBILE" },
    { key: "home.realisations.heading", label: "Accueil — titre section réalisations", section: "home",     value: "Nos Réalisations" },
    { key: "home.testimonials.heading", label: "Accueil — titre section avis",         section: "home",     value: "Ils nous font confiance" },
    { key: "contact.hero.subtitle",     label: "Contact — sous-titre",                 section: "contact",  value: "Discutons de votre projet. Chaque véhicule nécessite une approche unique, nos devis sont donc 100% personnalisés après étude de vos besoins." },
    { key: "services.hero.subtitle",    label: "Services — sous-titre",                section: "services", value: "Protection, correction, révélation. Des prestations premium pour chaque véhicule." },
    { key: "ppf.hero.subtitle",         label: "PPF — sous-titre hero",                section: "ppf",      value: "Le film de protection ultime, invisible et auto-cicatrisant. Disponible en version brillante ou satinée." },
    { key: "footer.address",            label: "Pied de page — adresse",               section: "footer",   value: "4 Rue du Canal, 57970 Basse-Ham" },
    { key: "footer.hours",              label: "Pied de page — horaires",              section: "footer",   value: "Sur rendez-vous uniquement" },
    { key: "contact.phone",         label: "Contact — téléphone (format brut, ex: +33382561062)", section: "contact", value: "+33382561062" },
    { key: "contact.phone_display", label: "Contact — téléphone (affiché, ex: +33 3 82 56 10 62)", section: "contact", value: "+33 3 82 56 10 62" },
    { key: "contact.email",         label: "Contact — adresse email",                  section: "contact", value: "contact@mvprotect.fr" },

    // ── Image d'accueil (hero) — gérées depuis un écran admin dédié,
    // pas depuis l'éditeur de textes générique (voir HERO_IMAGE_SECTION
    // côté frontend). Les valeurs par défaut pointent vers les fichiers
    // statiques existants, identiques au rendu d'avant cette fonctionnalité.
    { key: "home.hero.bgImage",           label: "Image — PC",                   section: "hero-image", value: "images/hero-bg.jpg" },
    { key: "home.hero.bgImagePosition",   label: "Image — PC (cadrage)",         section: "hero-image", value: "50% 50%" },
    { key: "home.hero.mobileImage",         label: "Image hero — Mobile/Tablette",           section: "hero-image", value: "images/hero-aerial.jpg" },
    // "50% 0%" = ancien "object-top" en dur : préserve le cadrage existant tant
    // que personne n'a repositionné l'image depuis /maximeadmin/hero.
    { key: "home.hero.mobileImagePosition", label: "Image hero — Mobile/Tablette (cadrage)", section: "hero-image", value: "50% 0%" },
  ];
  for (const block of initial) {
    await pool.query(
      `INSERT INTO content_blocks (key, label, section, value) VALUES ($1, $2, $3, $4) ON CONFLICT (key) DO NOTHING`,
      [block.key, block.label, block.section, block.value]
    );
  }
}

export async function runStartupSeed() {
  try {
    await runMigrations();
  } catch (err) {
    logger.warn({ err }, "Startup migrations failed (non-fatal)");
  }
  try {
    await seedContentBlocks();
  } catch (err) {
    logger.warn({ err }, "Content blocks seed failed (non-fatal)");
  }
  try {
    await updateArticleImages();
  } catch (err) {
    logger.warn({ err }, "Article image update failed (non-fatal)");
  }
  try {
    let inserted = 0;
    for (const article of ARTICLES) {
      const existing = await db
        .select({ id: articlesTable.id })
        .from(articlesTable)
        .where(eq(articlesTable.slug, article.slug));
      if (existing.length > 0) continue;
      await db.insert(articlesTable).values(article);
      inserted++;
    }
    if (inserted > 0) {
      logger.info({ inserted }, "Startup seed: articles insérés");
    }
  } catch (err) {
    logger.warn({ err }, "Startup seed failed (non-fatal)");
  }
}
