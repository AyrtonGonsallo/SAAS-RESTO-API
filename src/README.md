Architecture


Config
l'authentification a la db
utilisé dans app pour verifier la connexion avant les requettes qu demarrage

Emails
les templates des mails


Middlewares
les traitement a faire quand on recoit les requettes
auth est charge dans app
il laisse passer certaines routes et decode le token pour avoir les restos, societes, roles
il injecte user dans la requette
error est charge dans app a la fin il intercepte les erreurs et les mets dans logs/error.log
logger est charge dans app il intercepte toutes les requettes et le mets dans logs/combined.logs
tenant est chatge dans app il intercepte les requettes laisse passer certaines et lit user dans req pour injecter issuperadmin, restos et societe dans req
les routes vont lire ces valeur et filter


Models
les classes, les relations entre elles et elles sont chargees dans index

Modules
les fonctions complexes comme la reservation, le click and collect y seront
index est charge dans les routes lors de l'import des classes

PDf
les models de factures et recus y seront

Routes
les urls d'authentification et de crud
on doit limiter la taille des fichiers

Services
les fonctions pour envoyer les mails, verifier les tokens, avoir la liste des methodes
elles sont reutilisées ailleurs


Utils
les fonctions comme le logguer y sont
il est utilise dans les middleware de log

app

charge les middlewares 
les routes
ajoute le cors
verifie la connexion a la db

les crons

http://localhost:2026/api/v1/send_queued_messages envoi les messages de la partie mobile
http://localhost:2026/api/v1/update_reservations_statuts  met a jour le statut des tables et les libere
http://localhost:2026/api/v1/watch_reservations_delais surveille les delais et annulle les reservations