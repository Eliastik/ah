# Denis Brogniart – Ah !

Le fameux Ah de Denis Brogniart, directement sur votre navigateur web !

Apparemment, les femmes ne savent pas faire de cabanes. Cliquez autant de fois que vous voulez sur Denis pour qu'il dise Ah, ou faites le répéter en cliquant sur le bouton prévu pour cela. Vous pouvez aussi modifier sa voix !

* Version en ligne de ce programme : [www.eliastiksofts.com/ah](http://www.eliastiksofts.com/ah/)

## À propos du programme

* Version du programme : 2.1 REV1 (1/10/2017)
* Made in France by Eliastik - [eliastiksofts.com](http://eliastiksofts.com) - Contact : [eliastiksofts.com/contact](http://eliastiksofts.com/contact)
* Licence : GNU GPLv3 ([https://github.com/Eliastik/ah/blob/master/LICENCE.txt](https://github.com/Eliastik/ah/blob/master/LICENCE.txt))

### Crédits

* Utilise le thème Bootstrap Cosmo de Bootswatch ([https://bootswatch.com/cosmo/](https://bootswatch.com/cosmo/)), sous [licence MIT](https://tldrlegal.com/license/mit-license)
* Utilise la police d'icônes [Font Awesome](http://fontawesome.io/), sous [licence SIL OFL 1.1](http://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL) et [MIT](https://tldrlegal.com/license/mit-license)
* Utilise la bibliothèque logicielle [Soundtouch.js](https://github.com/ZVK/stretcher/blob/master/soundtouch.js) sous [licence GNU LGPL 2.1](https://www.gnu.org/licenses/old-licenses/lgpl-2.1.fr.html)
* Utilise la bibliothèque logicielle [Vocoder.js](https://github.com/jergason/Vocoder) sous [licence MIT](https://github.com/jergason/Vocoder/blob/master/LICENSE.txt) (code légèrement modifié)
* Utilise la bibliothèque logicielle [Recorderjs](https://github.com/mattdiamond/Recorderjs) ([version Worker](https://github.com/mattdiamond/Recorderjs/blob/ac0eb8a7c2601fc4ec1cbd1b1ee49f45a6c79580/recorderWorker.js)) sous [licence MIT](https://tldrlegal.com/license/mit-license).
* Utilise la bibliothèque logicielle [Boostrap Slider](https://github.com/seiyria/bootstrap-slider) en version 9.9.0, sous [licence MIT](https://github.com/seiyria/bootstrap-slider/blob/master/LICENSE.md)
* Utilise la bibliothèque logicielle [Boostrap Native](https://github.com/thednp/bootstrap.native), sous [licence MIT](https://github.com/thednp/bootstrap.native/blob/master/LICENSE)
* Utilise un fichier audio [Impulse Response](https://fr.wikipedia.org/wiki/R%C3%A9ponse_impulsionnelle) (utilisé par la fonction Réverbération) [venant d'ici](http://www.openairlib.net/auralizationdb/content/abernyte-grain-silo) (auteur : Nick Green), sous [licence CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/)
* Le Ah de Denis Brogniart vient de cette vidéo : [https://www.youtube.com/watch?v=6oTsleGsWT8](https://www.youtube.com/watch?v=6oTsleGsWT8)

## Journal des changements

* Version 2.1 (1/10/2017) :
    - Possibilité d'enregistrer la voix modifiée sous la forme d'un fichier audio au format wav ;
    - Amélioration des performances de la fonction Modifier la voix, la voix modifiée est mise en cache avant d'être jouée (uniquement lorsque le mode de compatibilité est désactivé) ;
    - Mode de compatibilité ajouté pour revenir à l'ancien mode de calcul de la fonction Modifier la voix, les navigateurs non compatibles ou ayant un bug sont détectés et ce mode s'active automatiquement. Ce mode ne permet pas d'enregistrer la voix modifiée ;
    - Corrections de bugs et améliorations diverses :
        - Correction d'un plantage avec les navigateurs ne supportant pas l'API Web Audio ;
        - Correction du code d'initialisation ;
        - Corrections d'autres bugs mineurs et autres ajustements.
    - Révision 1 de la version (1/10/2017) :
        - Correction d'un bug en rapport avec la fonction Modifier la voix (fréquence d'échantillonnage de l'audio) ;
        - Correction d'un bug avec Internet Explorer ;
        - Mise à jour de certaines bibliothèques logicielles (Bootstrap Slider et Bootstrap Native).

* Version 2.0 (14/09/2017) :
    - Possibilité de modifier la voix ! Différentes options sont disponibles : augmenter ou baisser la hauteur de la voix (effet chipmunk), la vitesse ou d'ajouter un effet de réverbération (fonctionne grâce à l'API Web Audio) ;
    - Ajout de la liste des navigateurs compatibles directement dans le programme ;
    - Modification de l'icône ;
    - Améliorations diverses :
        - Mise en page corrigée et améliorée ;
        - Déplacement du script Javascript et du style CSS principaux dans un fichier séparé du code HTML.

* Version 1.0.4 (24/07/2017) :
    - Correction de bugs mineurs ;
    - Ajout d'une section compatibilité dans le fichier README.

* Version 1.0.3 (18/07/2017) :
    - Ajout d'icônes ([Font Awesome](http://fontawesome.io/)) ;
    - Petites corrections (design, textes, autres).

* Version 1.0.2 (24/06/2017) :
    - Ajout du préchargement des données audio (code extrait d'un autre de mes projets, [Hacklol](http://hacklol.eliastiksofts.com)) ;
    - Correction du code de préchargement des images ;
    - Le chargement des images et données audio ont désormais lieu après le chargement de toute la page ;
    - Autres petites corrections et ajouts.

* Version 1.0.1 (18/06/2017) :
    - Ajout d'un thème de couleurs (pour Chrome pour Android) ;
    - Ajout de déclarations d'icônes dans le fichier index.html ;
    - Ajout d'un style de barre pour les mobiles Apple ;
    - Ajout d'un Web manifest (manifest.json) ;
    - Ajout d'un lien vers le fichier README.
    - Ajout du numéro de version en bas de la page ;
    - Correction d'un bug avec la valeur maximale possible de l'intervalle (qui est 2147483647). Entrer une valeur supérieure donnait une boucle infinie (qui pouvait amener au plantage du navigateur web).

* Version 1.0 (12/06/2017) :
    - Version initiale (obviously).

## Compatibilité

Denis Brogniart – Ah ! est compatible avec les navigateurs suivants (versions mobiles comprises) :

* Chrome, Chromium et autres navigateurs basés sur Chromium (Opera, Vivaldi, etc.) ;
* Firefox
* Safari

Les navigateurs suivants sont partiellement compatibles :

* Internet Explorer 9 et plus (l'animation ne se joue qu'une seule fois, cela est dû à la manière dont ce navigateur gère les fichiers GIF ainsi que son système de mise en cache) ;
* Edge (pareil que pour Internet Explorer).

Pour pouvoir utiliser la fonction &laquo; Modifier la voix &raquo;, il vous faut un navigateur relativement récent (les dernières versions des navigateurs ci-dessus sont usuellement compatibles avec cette fonction, sauf Internet Explorer).

Il n'est pas encore possible d'enregistrer les voix modifiées avec Firefox ou Edge pour l'instant, à cause d'un [bug de ce navigateur](https://bugzilla.mozilla.org/show_bug.cgi?id=1031851).

## To-do list :

To-do uniquement si possible :

* Vérifier la compatibilité avec les futures versions de Firefox (bug).

## Déclaration de licence

Copyright (C) 2017 Eliastik (eliastiksofts.com)

Ce programme est un logiciel libre ; vous pouvez le redistribuer ou le modifier suivant les termes de la GNU General Public License telle que publiée par la Free Software Foundation ; soit la version 3 de la licence, soit (à votre gré) toute version ultérieure.

Ce programme est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE ; sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER. Consultez la GNU General Public License pour plus de détails.

Vous devez avoir reçu une copie de la GNU General Public License en même temps que ce programme ; si ce n'est pas le cas, consultez http://www.gnu.org/licenses.

----

Copyright (C) 2017 Eliastik (eliastiksofts.com)

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program. If not, see http://www.gnu.org/licenses/.
