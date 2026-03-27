const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '../../logs/combined.log');


exports.getAllMethods = () => {
  
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
    
        return [...endpoints].join('<br>');
    
      } catch (error) {
        
    
        return 'Bienvenue sur l\'api resto';
    }
};