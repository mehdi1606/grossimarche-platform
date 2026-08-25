# Conformité - loi 09-08 / CNDP (Maroc)

Base documentaire pour la déclaration CNDP du traitement de données personnelles de
Grossimarché. Ce document décrit **quelles** données sont collectées, **pourquoi**, **où**
elles sont stockées, **combien de temps**, et **quels endpoints** servent les droits des
personnes.

## 1. Données personnelles collectées

| Donnée | Finalité | Base légale | Stockage |
|---|---|---|---|
| Téléphone / e-mail | Authentification (OTP), notifications de commande | Exécution du contrat | Table `users` (Postgres) |
| Nom complet | Personnalisation, facturation | Exécution du contrat | Table `users` |
| Adresses de livraison | Livraison des commandes | Exécution du contrat | Table `addresses` |
| Historique de commandes | Suivi, facturation, comptabilité | Obligation légale (comptable) | Tables `orders`, `order_items` |
| Points de fidélité | Programme de fidélité | Consentement | Tables `loyalty_*` |
| Journaux d'audit (IP, user-agent, actions) | Sécurité, traçabilité | Intérêt légitime | Table `audit_logs` |

**Jamais stocké :** aucune donnée de carte bancaire (PAN, CVV). Le périmètre PCI-DSS reste
entièrement chez CMI. Les codes OTP ne sont jamais stockés en clair (hash BCrypt, Redis, TTL
5 min) ni journalisés au-dessus de DEBUG.

## 2. Consentement

`consent_at` et `consent_version` sont enregistrés à la création du compte (première
connexion réussie). Une nouvelle version de politique invalide le consentement précédent.

## 3. Durées de conservation

| Donnée | Durée | Mécanisme |
|---|---|---|
| Codes OTP | 5 minutes | TTL Redis |
| Jetons de rafraîchissement | 30 jours | TTL Redis |
| Journaux d'audit | configurable (`grossimarche.retention.audit-log-days`, défaut 365 j) | tâche planifiée `RetentionService` |
| Commandes | conservation légale comptable (10 ans) | non purgées |
| Compte inactif | anonymisation sur demande ou politique | `DELETE /me` |

## 4. Droits des personnes - endpoints

| Droit | Endpoint |
|---|---|
| Accès (portabilité) | `GET /api/v1/me/export` - export JSON complet |
| Rectification (profil) | `PATCH /api/v1/me` |
| Rectification (téléphone/e-mail) | `POST /api/v1/me/contact/request` puis `/contact/verify` (nouvelle vérification OTP obligatoire) |
| Effacement | `DELETE /api/v1/me` - anonymisation : identifiants supprimés/remplacés, statut `DELETED`, adresses et panier supprimés ; les commandes sont conservées pour la comptabilité, dissociées des identifiants personnels |

## 5. Sécurité (résumé)

- Authentification sans mot de passe (OTP) ; JWT RS256 (clé privée jamais exposée).
- Rotation des jetons de rafraîchissement avec détection de réutilisation (révocation de la
  famille), denylist des jetons d'accès à la déconnexion.
- Rate limiting sur l'envoi/vérification OTP (par destination et par IP).
- En-têtes de sécurité (HSTS, CSP, X-Content-Type-Options, X-Frame-Options).
- Journalisation d'audit : connexion, échec OTP, changements de statut de commande, actions
  admin, export et suppression de compte.

## 6. À finaliser avant mise en production

- **Chiffrement au repos** du téléphone et de la ligne d'adresse (JPA `AttributeConverter`
  + index aveugle pour la recherche par téléphone). *Reporté* : nécessite de router les
  recherches `findByPhone/findByEmail` via l'index aveugle. Voir la note dans le README.
- Masquage systématique des identifiants dans les logs JSON structurés.
