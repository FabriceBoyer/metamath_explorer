# Metamath Explorer

Un explorateur visuel et pédagogique de [set.mm](https://github.com/metamath/set.mm), la base de données [Metamath](https://us.metamath.org) de logique et de théorie des ensembles — probablement la plus grande bibliothèque de mathématiques entièrement vérifiées par ordinateur.

**100 % frontend, 100 % dans le navigateur.** Il n'y a aucun backend : `set.mm` (~50 Mo, ~120 000 énoncés) est téléchargé une fois, mis en cache dans IndexedDB, puis analysé et vérifié localement, dans un Web Worker, avec une copie vendorisée de [`google/metamath.js`](https://github.com/google/metamath.js).

➡️ [`/how-it-works`](#) explique le fonctionnement de Metamath pas à pas, avec une preuve miniature interactive rejouée par le vrai moteur de vérification.

## Fonctionnalités

- **Page d'accueil** présentant le projet et quelques statistiques en direct sur la base chargée.
- **Guide interactif « Comment marche Metamath »** : constantes/variables, hypothèses flottantes (`$f`) et essentielles (`$e`), axiomes/définitions (`$a`), théorèmes/preuves (`$p`), variables disjointes (`$d`), portée (`${ $}`) — avec un lecteur pas-à-pas d'une vraie preuve (`idALT : ⊢ (φ → φ)`, décompressée et vérifiée en direct).
- **Navigation "livre"** (`/browse`) : table des matières fidèle à la structure réelle de `set.mm` (parties, sections, mathboxes des contributeurs), recherche par label, fiche détaillée par énoncé (assertion, hypothèses, variables disjointes, commentaire avec liens croisés `~ label`, dépendances, vérification de preuve à la demande).
- **Graphe de dépendances interactif** (`/graph`) : explorez, nœud par nœud, ce dont un théorème dépend et ce qui en dépend, en partant d'un énoncé donné.
- **Base de données locale** (`/settings`) : état du cache, taille, statistiques, retéléchargement/purge.
- **i18n** français/anglais, **thème** clair/sombre/système.

## Comment ça marche (architecture)

Le pipeline s'exécute entièrement côté client, dans `src/workers/metamath.worker.ts` :

1. **Téléchargement** de `set.mm` depuis le miroir GitHub officiel (avec suivi de progression), mis en cache dans IndexedDB (`idb-keyval`) avec un hash SHA-256 comme clé de version.
2. **Analyse rapide** (`buildFastIndex`, ~2-5 s pour tout `set.mm`) : un simple passage du parseur vendorisé, sans suivi de portée, suffit pour extraire labels, expressions, commentaires, sections et — pour les preuves compressées — les dépendances externes (déjà présentes littéralement entre parenthèses dans le format compressé). L'application devient utilisable (navigation, recherche, graphe) après cette seule étape.
3. **Enrichissement** (`enrichIndexWithEngine`, ~1 min en tâche de fond) : un second passage exécute le moteur complet (`MM.feed`), qui reconstruit la portée des variables/hypothèses et calcule les hypothèses obligatoires de chaque axiome/théorème — nécessaire pour l'affichage détaillé et la vérification de preuve à la demande.
4. Le résultat enrichi est mis en cache ; les visites suivantes sont donc instantanées (aucun retéléchargement ni ré-analyse tant que `set.mm` n'a pas changé).
5. La **vérification** d'une preuve donnée est calculée à la demande via un message envoyé au worker, qui rejoue l'algorithme de vérification du moteur vendorisé sur cet unique théorème (millisecondes).

Voir [`src/vendor/metamath-js/NOTICE.md`](src/vendor/metamath-js/NOTICE.md) pour le détail de ce qui est repris tel quel de `google/metamath.js` (licence Apache 2.0) : le parseur, le moteur de portée/hypothèses et le vérificateur de preuves ne sont **pas réimplémentés** par ce projet. Seule une conversion mécanique CommonJS → ES modules a été appliquée. La logique ajoutée ici (extraction des commentaires/sections, construction de l'index de navigation, mise en cache, interface) est indépendante de la grammaire Metamath elle-même.

## Stack technique

- [Vite](https://vite.dev) + [React 19](https://react.dev) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com) + composants façon [shadcn/ui](https://ui.shadcn.com) (Radix UI + `class-variance-authority`)
- [Framer Motion](https://motion.dev) pour les animations
- [@xyflow/react](https://reactflow.dev) (React Flow) pour le graphe de dépendances
- [react-i18next](https://react.i18next.com) pour l'internationalisation
- [Zustand](https://zustand-demo.pmnd.rs) pour l'état global (résultats du worker)
- [idb-keyval](https://github.com/jakearchibald/idb-keyval) pour le cache IndexedDB
- [Vitest](https://vitest.dev) + Testing Library pour les tests
- [TypeDoc](https://typedoc.org) pour la documentation technique interne (pas de backend, donc pas de Swagger/OpenAPI — voir plus bas)

## Démarrage

```bash
npm install
npm run dev
```

Ouvrez ensuite `http://localhost:5173`. Au premier chargement d'une page `/browse` ou `/graph`, `set.mm` est téléchargé (~50 Mo) puis analysé — comptez une bonne minute la première fois, instantané ensuite.

### Scripts disponibles

| Script                            | Description                                                                                       |
| --------------------------------- | ------------------------------------------------------------------------------------------------- |
| `npm run dev`                     | Serveur de développement Vite                                                                     |
| `npm run build`                   | Build de production (`tsc -b && vite build`)                                                      |
| `npm run preview`                 | Sert le build de production localement                                                            |
| `npm run lint`                    | Lint (`oxlint`)                                                                                   |
| `npm run typecheck`               | Vérification des types sans émission                                                              |
| `npm run test` / `test:run`       | Tests unitaires (Vitest), mode watch / CI                                                         |
| `npm run format` / `format:check` | Formatage (Prettier)                                                                              |
| `npm run docs`                    | Génère la documentation technique interne (TypeDoc) dans `docs-site/`                             |
| `npm run smoke-test`              | Script de sanity-check du pipeline de parsing sur un vrai `set.mm` (voir `scripts/smoke-test.ts`) |

### Docker

```bash
# Build de production servi par nginx sur http://localhost:8080
docker compose up app

# Serveur de développement avec live-reload sur http://localhost:5173
docker compose --profile dev up dev
```

## Structure du projet

```
src/
  vendor/metamath-js/   # Copie vendorisée de google/metamath.js (Apache-2.0) — voir NOTICE.md
  lib/metamath/         # Modèle de données, index-builder (2 passes), extraction commentaires/sections
  lib/db/               # Cache IndexedDB, hachage SHA-256
  workers/              # Le pipeline complet (fetch → parse → enrichissement → vérification à la demande)
  store/                # État global (Zustand) branché sur le worker
  components/metamath/  # MathFormula, CommentText, ProofStepsTable, ToyProofStepper, graphe...
  components/ui/        # Primitives façon shadcn/ui
  pages/                # Accueil, Comment ça marche, Browse, Statement, Graph, Settings
  i18n/                 # Traductions FR/EN
scripts/
  smoke-test.ts         # Sanity-check du pipeline sur le vrai set.mm (hors navigateur, via tsx)
```

## Tests

```bash
npm run test:run
```

Les tests couvrent la couche d'extraction (commentaires, sections, bannières ASCII de `set.mm`, y compris le cas piège où le texte d'introduction de `set.mm` contient un exemple littéral `<label> $a ... $.` qui ne doit pas être confondu avec un vrai énoncé), la classification des énoncés, et un test de bout en bout du pipeline d'indexation (rapide + enrichi) sur une mini-base Metamath valide.

## Pourquoi pas de Swagger/API ?

Ce projet n'a délibérément aucun backend : toutes les données proviennent directement de GitHub (`set.mm`) et tout le calcul (analyse, vérification) se fait dans le navigateur du visiteur. Une spécification OpenAPI/Swagger n'aurait donc pas de sens ici — il n'existe pas de service HTTP à documenter. La documentation technique du code (types, fonctions du pipeline, du store, du cache) est générée avec **TypeDoc** (`npm run docs`) et publiée aux côtés du site sur GitHub Pages, sous `/docs`.

## CI/CD

- **`.github/workflows/ci.yml`** : lint, formatage, typecheck, tests unitaires et build sur chaque push/PR vers `main`.
- **`.github/workflows/deploy.yml`** : build de production + documentation TypeDoc, déployés sur GitHub Pages à chaque push sur `main`.

L'application utilise un `HashRouter` (URLs du type `#/browse/ax-1`) plutôt qu'un routeur basé sur l'historique HTML5, précisément parce que GitHub Pages (comme tout hébergement 100 % statique) ne peut pas rediriger les chemins profonds vers `index.html` côté serveur.

## Limites connues / pistes d'amélioration

- Le passage d'enrichissement (~1 minute au premier chargement) est une opération bloquante unique dans le worker ; une progression fine pendant cette étape n'est pas disponible (voir le commentaire dans `enrichIndexWithEngine`). Une piste : précalculer l'index enrichi côté CI (avec le même moteur vendorisé, exécuté par Node) et le publier comme artefact statique téléchargeable, pour un chargement instantané dès la première visite.
- Le rendu des formules reste au niveau des tokens ASCII de Metamath (pas de rendu LaTeX/MathML).
- Les preuves très longues (certains théorèmes de `set.mm` ont des milliers d'étapes une fois décompressées) sont paginées dans l'affichage mais peuvent rester coûteuses à afficher intégralement.

## Licence

Code de ce projet sous licence [MIT](LICENSE).

- `set.mm` est dans le domaine public ([CC0](https://github.com/metamath/set.mm/blob/develop/LICENSE.txt)) — il n'est pas inclus dans ce dépôt, seulement téléchargé à l'exécution.
- `src/vendor/metamath-js/` est une copie de [`google/metamath.js`](https://github.com/google/metamath.js), sous licence [Apache 2.0](src/vendor/metamath-js/LICENSE).

Ce projet est un travail éducatif indépendant, non affilié au projet Metamath.
