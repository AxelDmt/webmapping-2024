const express = require('express');
const cors = require('cors'); // Importer le middleware cors
const path = require('path'); // Importer path pour gérer les chemins de fichiers
const { Pool } = require('pg'); // Importer Pool depuis 'pg'
const app = express();
const port = 3000;

// Configurer le middleware cors
app.use(cors());

// Configurer le middleware pour parser les corps des requêtes
app.use(express.json());

// Configurer le middleware pour servir des fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Créer une instance de Pool pour la connexion à PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'seismic_data',
  password: 'postgres', // Remplacez par votre mot de passe
  port: 5432,
});

// Route pour récupérer les tremblements de terre
app.get('/earthquakes', async (req, res) => {
  // Extraire les paramètres de requête
  const { minTime, maxTime, minDepth, maxDepth, minMagnitude, maxMagnitude, bbox } = req.query;

  // Définir les coordonnées de la bbox par défaut si non fournies
  const defaultBBox = '-180,-90,180,90';
  const [minLon, minLat, maxLon, maxLat] = bbox ? bbox.split(',').map(Number) : defaultBBox.split(',').map(Number);

  // Construire la requête SQL de base
  let query = `
    SELECT * FROM earthquakes
    WHERE (latitude BETWEEN $1 AND $2)
    AND (longitude BETWEEN $3 AND $4)
  `;
  const queryParams = [minLat, maxLat, minLon, maxLon];

  // Ajouter les filtres temporels
  if (minTime) {
    query += ' AND time >= $5';
    queryParams.push(minTime);
  }
  if (maxTime) {
    query += ' AND time <= $6';
    queryParams.push(maxTime);
  }

  // Ajouter les filtres de profondeur
  if (minDepth) {
    query += ' AND depth >= $7';
    queryParams.push(minDepth);
  }
  if (maxDepth) {
    query += ' AND depth <= $8';
    queryParams.push(maxDepth);
  }

  // Ajouter les filtres de magnitude
  if (minMagnitude) {
    query += ' AND magnitude >= $9';
    queryParams.push(minMagnitude);
  }
  if (maxMagnitude) {
    query += ' AND magnitude <= $10';
    queryParams.push(maxMagnitude);
  }

  try {
    const result = await pool.query(query, queryParams);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur lors de la récupération des données');
  }
});

// Route pour servir le fichier index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrer le serveur
app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}`);
});