import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Politique de confidentialité — Aurixen" },
      {
        name: "description",
        content:
          "Politique de confidentialité d'Aurixen : données collectées, stockage, sécurité, droits et contacts.",
      },
      { property: "og:title", content: "Politique de confidentialité — Aurixen" },
      {
        property: "og:description",
        content:
          "Comment Aurixen collecte, protège et utilise vos données personnelles.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PrivacyPage,
});

const sections: { title: string; body: string[] }[] = [
  {
    title: "1. Responsable du traitement",
    body: [
      "Aurixen est un système privé de gestion et de pilotage entrepreneurial, édité et opéré par le propriétaire du site (ci-après « Aurixen »).",
      "Cette politique décrit comment sont collectées, utilisées et protégées les informations traitées dans le cadre de l'utilisation du site.",
    ],
  },
  {
    title: "2. Données collectées",
    body: [
      "Compte d'accès : adresse e-mail et mot de passe (chiffré) servant à l'authentification privée.",
      "Contenus saisis : notes, idées, stratégies, événements de calendrier, fiches restaurants, pins, ventes, fichiers et dossiers que vous créez volontairement.",
      "Fichiers : documents que vous téléversez dans l'espace de stockage dédié.",
      "Données techniques : journaux de connexion et métadonnées d'usage limitées, nécessaires au fonctionnement et à la sécurité du service.",
    ],
  },
  {
    title: "3. Finalités du traitement",
    body: [
      "Authentifier l'utilisateur autorisé et sécuriser l'accès au système privé.",
      "Permettre la création, l'organisation et le suivi des projets entrepreneuriaux.",
      "Stocker et organiser les contenus et fichiers associés à chaque projet.",
      "Assurer le bon fonctionnement, la stabilité et la sécurité technique du service.",
    ],
  },
  {
    title: "4. Base légale",
    body: [
      "Le traitement repose sur le consentement de l'utilisateur (article 6.1.a du RGPD) pour les données non strictement nécessaires, et sur l'intérêt légitime du responsable pour la sécurité et le fonctionnement du service.",
      "Le consentement peut être retiré à tout moment, sans effet rétroactif, en demandant la suppression du compte et des données associées.",
    ],
  },
  {
    title: "5. Stockage et hébergement",
    body: [
      "Les données sont hébergées sur une infrastructure cloud sécurisée située au sein de l'Union européenne.",
      "Le mot de passe n'est jamais stocké en clair : il est protégé par un mécanisme de hachage unidirectionnel.",
      "Les fichiers sont conservés dans un espace de stockage privé soumis à un contrôle d'accès strict par ligne (RLS).",
    ],
  },
  {
    title: "6. Sécurité",
    body: [
      "L'accès à l'ensemble du système est protégé par authentification et n'est accessible qu'au propriétaire autorisé.",
      "Les mots de passe des services externes (Pinterest, Gumroad, etc.) ne sont jamais demandés ni stockés par Aurixen : seuls des jetons d'accès officiels peuvent être utilisés, et ils restent côté serveur dans des variables secrètes.",
      "Des mesures techniques (chiffrement des connexions, contrôle d'accès, journalisation) sont mises en œuvre pour protéger les données contre la perte, l'accès non autorisé ou la divulgation.",
    ],
  },
  {
    title: "7. Durée de conservation",
    body: [
      "Les données sont conservées pour la durée d'utilisation du service par le propriétaire.",
      "À la demande, ou en cas de suppression du compte, les données associées sont supprimées dans un délai raisonnable, à l'exception des éventuelles obligations légales de conservation.",
    ],
  },
  {
    title: "8. Partage et destinataires",
    body: [
      "Aurixen est un système strictement privé. Les données ne sont pas vendues, échangées ni partagées avec des tiers à des fins commerciales.",
      "Les seuls destinataires sont l'hébergeur technique et les presteurs d'infrastructure agissant en qualité de sous-traitants, soumis à des obligations de confidentialité et de sécurité.",
    ],
  },
  {
    title: "9. Vos droits",
    body: [
      "Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, de portabilité et d'opposition concernant vos données.",
      "Vous pouvez exercer ces droits en vous adressant au responsable du traitement via les coordonnées ci-dessous.",
      "Vous avez également la possibilité d'introduire une réclamation auprès de l'autorité de contrôle compétente (en Belgique : l'Autorité de protection des données — apd-gba.be).",
    ],
  },
  {
    title: "10. Cookies",
    body: [
      "Aurixen n'utilise pas de cookies publicitaires ni de traceurs tiers.",
      "Seuls des éléments techniques strictement nécessaires au fonctionnement de l'authentification et de la session peuvent être présents.",
    ],
  },
  {
    title: "11. Contact",
    body: [
      "Pour toute question relative à cette politique de confidentialité ou à vos données, vous pouvez contacter le responsable du traitement à l'adresse e-mail associée à votre compte Aurixen.",
    ],
  },
  {
    title: "12. Modifications",
    body: [
      "Cette politique peut être mise à jour pour refléter l'évolution du service ou de la réglementation. La date de dernière mise à jour est indiquée ci-dessous.",
    ],
  },
];

function PrivacyPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="veil pointer-events-none absolute inset-x-0 top-0 h-72" />

      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
          <Link
            to="/"
            aria-label="Retour à l'accueil"
            className="-ml-2 flex size-10 items-center justify-center rounded-full text-muted-foreground active:bg-muted"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <p className="brand-wordmark truncate text-sm text-foreground">
            Aurixen
          </p>
        </div>
        <div className="hairline h-px" />
      </header>

      <main className="relative mx-auto max-w-3xl px-4 py-10 pb-20">
        <p className="text-[11px] text-primary">Document légal</p>
        <h1 className="brand-wordmark mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
          Politique de confidentialité
        </h1>
        <div className="hairline mt-6 h-px" />
        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
          Le présent document décrit la manière dont Aurixen collecte, utilise et
          protège les données personnelles dans le cadre de son fonctionnement en
          tant que système privé de pilotage entrepreneurial.
        </p>

        <div className="mt-10 space-y-10">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold text-foreground">
                {section.title}
              </h2>
              <div className="mt-3 space-y-3">
                {section.body.map((p, i) => (
                  <p key={i} className="text-sm leading-relaxed text-muted-foreground">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 border-t border-border/70 pt-6">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Dernière mise à jour : août 2026
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Édité par le propriétaire d'Aurixen. Accès privé réservé au
            responsable du traitement.
          </p>
        </div>
      </main>
    </div>
  );
}
