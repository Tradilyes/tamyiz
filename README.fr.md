# tamyiz

**La jurisprudence interne d'une direction juridique, pour tous ses outils d'IA.**
Chaque outil d'IA — les agents de Claude for Legal, un produit legaltech, un modèle bien instruit —
lit le playbook de l'équipe à sa façon. Sur les points clairs, ils sont d'accord entre eux et avec
l'équipe. Aux limites, là où le playbook ne dit pas assez, ils restent d'accord entre eux — et peuvent
tous se tromper sur ce que voulait le directeur juridique. tamyiz trouve ces limites, pose chaque
question une fois au directeur juridique, fait de sa réponse une décision qui lie tous les outils, et
vérifie qu'ils la suivent, aujourd'hui et après la prochaine mise à jour du modèle.

En arabe, *tamyīz* (تمييز) signifie discernement ; c'est aussi le nom de la cour de cassation à Dubaï,
au Koweït et en Jordanie : la cour dont les arrêts font que la loi se lit partout de la même façon.

[English](README.md) · [العربية](README.ar.md)

## Ce qu'il a montré (2 novembre 2026)

Vingt-cinq NDA aux limites du playbook d'une société de Dubaï, lus par quatre IA : Claude Opus 5.5
seul ; Claude Opus 5.5 avec le trieur de NDA de Claude for Legal, configuré pour l'équipe ; Claude
Sonnet 5.5 seul ; Claude Haiku 5.5 en agent avec les contrôles de
[courtproof](https://github.com/Tradilyes/courtproof). Dix questions d'interprétation, chacune en deux
rédactions (l'une soumise au directeur juridique, l'autre gardée pour le test), et cinq contrôles,
dont trois vérifient qu'une décision ne va pas plus loin que prévu. Corrigés enregistrés avant la
première passe, décisions avant les passes qui les testent ([résultats](suites/nda-boundary/RESULTS.md)).

1. **Les quatre IA lisent les dix clauses limites de la même façon** : huit comme le voulait le
   directeur juridique, deux autrement, toutes ensemble. Un NDA de trois ans renouvelable sauf préavis
   part en revue par un juriste (durée trop longue) ; la protection usuelle des secrets d'affaires
   « tant qu'ils restent secrets » part en revue juridique complète (perpétuelle). Comparer les outils
   entre eux ne montre rien ; seule la revue des limites par le directeur juridique le montre.
2. **Deux décisions ont corrigé tous les outils d'un coup**, agent officiel compris : sur des
   rédactions nouvelles des mêmes clauses, chacun passe de 8/10 à **10/10**.
3. **Les décisions ne débordent pas** : une durée initiale de cinq ans, un renouvellement qu'on ne
   peut pas arrêter, des informations « hautement confidentielles » protégées sans fin restent
   signalés par tous. Le seul vrai désaccord de l'étude (un outil voyait aussi une obligation
   perpétuelle dans le renouvellement sans fin) disparaît sous la première décision.

Le coût par NDA n'a presque pas bougé : les deux décisions ajoutent moins de deux cents mots.

## Comment ça marche

Playbook → NDA limites (chaque position à sa limite, deux rédactions) → plusieurs relecteurs IA →
lectures divergentes, ou différentes de celle de l'équipe → le directeur juridique tranche une fois,
motifs à l'appui → jurisprudence interne (datée, sourcée, en vigueur ou renversée) → instructions de
tous les outils, et tests de non-régression → revue des décisions touchées quand la loi ou le playbook
change.

## L'utiliser

- **Dans Claude**, en page partagée par l'équipe : `desk/` construit le *Tamyiz NDA Desk* — revue de
  NDA en anglais et en arabe avec les contrôles de courtproof comme outils de Claude, questions au
  directeur juridique en un clic, décisions qui lient toutes les revues suivantes, sondes aux limites,
  jurisprudence copiable dans n'importe quel autre outil.
- **En ligne de commande**, avec n'importe quel relecteur : `node suites/nda-boundary/run.mjs …`
- **Dans le code** : `engine/caselaw.mjs` et `engine/mine.mjs`, sans dépendance.

## Limites

Une seule série (NDA, en anglais, 25 documents, une passe par relecteur et condition), écrite par
l'auteur pour une société fictive ; un autre directeur juridique pourrait trancher autrement — la
méthode ne dit pas ce qui est juste, elle rend le choix de l'équipe explicite, obligatoire et vérifié.
Quatre relecteurs, tous sur des modèles Claude. Prochaines étapes : NDA limites générés depuis un
playbook, en anglais, arabe et français ; série « fournisseurs d'IA » depuis compliance-atlas ;
décisions qui reposent sur un fait juridique signalées quand ce fait change.

---

Conçu par **ILYES M. TRAD**, chercheur en droit et intelligence artificielle. Rédigé avec l'aide d'un
assistant d'IA (Claude) ; chaque chiffre vient du code et des réponses du dépôt. Licence MIT.
