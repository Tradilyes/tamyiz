# tamyiz — résumé

Un programme de recherche sur la façon dont les IA lisent et appliquent les règles juridiques, en arabe
et en français autant qu'en anglais. Ses réponses de référence viennent du droit lui-même (le texte
officiel à une date donnée, les décisions publiées, l'histoire des textes), non d'un vote. Chaque étude
est enregistrée publiquement avant d'être lancée ; ses questions, ses corrigés, les réponses brutes des
modèles et le code sont dans ce dépôt.

Le texte de référence est en anglais : [README.md](README.md).

## Étude B — Égaux devant la machine ?

Un salarié qui interroge une IA sur ses droits le fait dans sa langue. Aux Émirats et en Arabie
saoudite, la loi est rédigée en arabe, mais la plupart des salariés du privé poseraient leur question
en anglais ; en France, beaucoup la poseraient en arabe. La réponse dépend-elle de la langue ?

54 questions de droit du travail (Émirats, Arabie saoudite, France), chacune avec une réponse chiffrée
vérifiée le 4 novembre 2026 sur le texte officiel ou une page ministérielle, dont 11 sur des règles en
vigueur depuis 2024 ; chacune posée en arabe, en français et en anglais à Claude Haiku 5.5, Sonnet 5.5
et Opus 5.5, trois fois ; puis un tour où l'utilisateur conteste la réponse ; et Opus avec recherche
web. Protocole, questions, code et analyse enregistrés sur GitHub avant la première réponse (commit
`abd08ca`).

**Résultats** ([RESULTS.md](suites/language-parity/RESULTS.md), produits par l'analyse enregistrée) :

| | Haiku 5.5 | Sonnet 5.5 | Opus 5.5 |
|---|---|---|---|
| Justes au passage 1, arabe / français / anglais (sur 54) | 48 / 44 / 48 | 50 / 52 / 51 | 54 / 54 / 54 |
| H1 : désaccord supplémentaire entre langues, au-delà des passages dans une même langue (intervalle à 95 %) | +0,023 (0,000 à +0,051) : non retenue | +0,014 (−0,007 à +0,045) : non retenue | 0,000 : non retenue |
| Réponses justes, règles en vigueur depuis 2024 / autres règles | 64 % / 92 % | 79 % / 98 % | 100 % / 99,7 % |
| Réponses fausses sur une règle modifiée qui donnent l'ancienne règle | 21 sur 21 | 17 sur 17 | aucune réponse fausse |
| A cédé quand on lui a dit qu'une réponse juste était fausse | 9 sur 140 | 5 sur 153 | 0 sur 162 |

- **Pas d'écart entre langues au-delà du hasard.** Pour aucun des trois modèles, les réponses ne
  diffèrent davantage d'une langue à l'autre que d'un passage à l'autre dans la même langue. Opus donne
  la même réponse juste en arabe, en français et en anglais à chaque question.
- **La date compte plus que la langue.** Haiku et Sonnet se trompent bien plus souvent sur les règles
  en vigueur depuis 2024 (28 et 20 points de moins). Chacune de leurs réponses fausses sur une règle
  dont l'ancienne valeur est connue reproduit cette ancienne valeur, dans n'importe quelle langue :
  Sonnet donne 90 jours de période d'essai en Arabie saoudite dans les trois langues (180 depuis
  février 2025) ; Haiku, 10 semaines de congé de maternité (12). Confiance moyenne déclarée pour ces
  réponses fausses : 68 et 84 sur 100.
- **La recherche web ne change rien pour Opus**, déjà juste partout ; invité à vérifier en ligne, il
  cherche à chaque réponse mais n'ouvre une page officielle que 5 fois sur 162.
- **Contestation.** Quand on lui dit qu'une réponse juste est fausse, Opus ne cède jamais ; Haiku
  adopte le chiffre faux 9 fois sur 140, Sonnet 5 fois sur 153.

Sur des règles chiffrées, Opus atteint le plafond : l'étude ne peut donc pas montrer d'effet de la
langue pour lui. L'étude C passe à l'interprétation des clauses, là où les juges eux-mêmes divergent.

Limites : un seul fournisseur ; des règles chiffrées, non un raisonnement juridique ; des traductions
vérifiées par un modèle, non par un traducteur ; des corrigés tels qu'au 4 novembre 2026. Tout est
dans [suites/language-parity/](suites/language-parity/).

## Pilote — playbooks de contrats (2 novembre 2026)

Vingt-cinq NDA aux limites du playbook d'une société fictive de Dubaï, lus par quatre configurations
d'un seul fournisseur. Les quatre ont lu les dix clauses limites de la même façon (10/10, intervalle à
95 % : 72 à 100 %), et deux fois autrement que le corrigé fixé par l'auteur. Un signal, pas un
résultat : [analysis/PILOT.md](analysis/PILOT.md).

## Suite

- **Étude C — Juges divisés, machines unanimes ?** Des clauses de contrats sur lesquelles deux
  juridictions françaises ont divergé, tirées des arrêts publiés de la Cour de cassation (dénaturation
  d'une clause claire ; pouvoir souverain des juges du fond sur une clause ambiguë). La référence
  humaine est le désaccord motivé des juges. Note de conception :
  [suites/divided-courts/DESIGN.md](suites/divided-courts/DESIGN.md).
- **Étude D — L'observatoire de la mise à jour.** Les questions de l'étude B sur des règles récentes,
  reposées chaque mois : combien de temps une IA met-elle à apprendre qu'une règle a changé ?
- L'étude A, qui exigeait un collège de juristes recrutés, est mise de côté.

## Usage de l'IA

La conception, les questions, les traductions, le code et les brouillons de ces pages ont été produits
avec Claude (Anthropic) sous la direction de l'auteur ; les corrigés ont été vérifiés sur les sources
citées pour chaque question. Les modèles évalués sont du même fournisseur, ce que les pages de l'étude
déclarent comme limite.

Auteur : Ilyes M. Trad, doctorant en droit (intelligence artificielle et technologies juridiques),
MANAR University. Licence MIT.
