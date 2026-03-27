const router = require('express').Router();
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '../../logs/combined.log');

router.get('/liste_des_methodes', (req, res) => {
  try {
    const content = fs.readFileSync(logFile, 'utf-8');

    const regex = /\[\w+\]\s+([A-Z]+)\s+([^\s]+)/g;

    const endpoints = new Set();
    let match;

    while ((match = regex.exec(content)) !== null) {
      const method = match[1];
      let route = match[2];

      // 🔥 remplacer les IDs numériques
      route = route.replace(/\/\d+/g, '/:id');

      endpoints.add(`${method} ${route}`);
    }

    //return res.json([...endpoints]);

    res.send([...endpoints].join('<br>'));

  } catch (error) {
    console.error('Erreur lecture log:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Impossible de lire le fichier log'
    });
  }
});

module.exports = router;