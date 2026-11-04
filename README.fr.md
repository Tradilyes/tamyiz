# tamyiz — résumé

Un programme de recherche sur la façon dont les IA lisent les règles juridiques, et sur les moyens,
pour une équipe juridique, de leur faire lire ses règles comme elle l'entend. Il établit des lectures
de référence avec un collège de juristes, conserve leurs désaccords, et mesure les IA par rapport à
elles, en anglais, en français et en arabe.

Le texte de référence est en anglais : [README.md](README.md).

## La question

Un playbook de contrats dit à un relecteur, humain ou IA, ce que l'entreprise accepte. Il ne tranche
pas tout : certaines clauses tombent dans la zone où des juristes compétents divergent. Deux questions
en découlent. Là où les juristes se partagent, les IA de fournisseurs différents convergent-elles
quand même vers une seule lecture, tranchant ainsi une question que personne n'a décidée ? Et des
décisions écrites par l'équipe peuvent-elles aligner toutes les IA sur la lecture de l'équipe, sans
déborder sur d'autres cas ?

## Le pilote (2 novembre 2026)

Vingt-cinq NDA aux limites du playbook d'une société fictive de Dubaï, lus par quatre configurations
d'un seul fournisseur (Anthropic), une fois chacune.

- Les quatre ont lu les dix clauses limites de la même façon : 10/10 (intervalle de confiance à 95 % :
  72 à 100 %).
- Huit fois comme le corrigé fixé par l'auteur : 8/10 (49 à 94 %).
- Après deux décisions écrites, chacune passe de 8/10 à 10/10 sur des rédactions nouvelles ; le test
  apparié donne p = 0,50, donc rien n'est démontré.

Ce pilote motive l'étude A ; il ne la remplace pas. Le corrigé a été fixé par l'auteur, l'échantillon
est petit, et un seul fournisseur a été testé. Détails : [analysis/PILOT.md](analysis/PILOT.md).

## L'étude A (en préparation)

Au moins quarante questions en trois rédactions, lues par au moins cinq juristes et par au moins
quatre familles de modèles, trois fois chacune ; une partie des textes reste privée. Protocole :
[PROTOCOL.md](PROTOCOL.md). Consignes pour le collège : [annotation/LISEZMOI.md](annotation/LISEZMOI.md).
Dépôt public du protocole sur OSF avant toute lecture ; soumission visée : ICAIL 2027.

## Usage de l'IA

Le code, les textes du pilote, ses corrigés et ses décisions, et les brouillons de cette page ont été
écrits avec Claude (Anthropic) sous la direction de l'auteur. Les questions de recherche, la méthode et
la décision de publier sont de l'auteur, qui relit et réécrit si nécessaire les textes, corrigés et
décisions avant l'étude A. Les lectures du collège sont humaines.

Auteur : Ilyes M. Trad, doctorant en droit (intelligence artificielle et technologies juridiques),
MANAR University. Licence MIT.
