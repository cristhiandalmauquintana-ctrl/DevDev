// server.js
// Backend simple: usa un Personal Access Token para hablar con GitHub.
// No hay login, no hay OAuth. El token vive como variable de entorno.

const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static('public')); // aquí sirve el index.html del editor

const PORT = process.env.PORT || 3000;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = process.env.REPO_OWNER;   // tu usuario de GitHub
const REPO_NAME = process.env.REPO_NAME;     // el repo donde se guardan los proyectos

const githubApi = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Authorization: `token ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json'
  }
});

// ---------------------------------------------
// Leer un archivo del repo
// ---------------------------------------------
app.get('/api/file', async (req, res) => {
  const path = req.query.path; // ej: "mi-juego/index.html"
  try {
    const response = await githubApi.get(
      `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`
    );
    const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
    res.json({ content, sha: response.data.sha });
  } catch (error) {
    if (error.response?.status === 404) {
      res.json({ content: '', sha: null }); // archivo nuevo, aún no existe
    } else {
      res.status(500).json({ error: 'Error leyendo el archivo de GitHub' });
    }
  }
});

// ---------------------------------------------
// Guardar (crear o actualizar) un archivo en el repo
// ---------------------------------------------
app.put('/api/file', async (req, res) => {
  const { path, content, sha } = req.body; // sha solo si el archivo ya existía

  try {
    const response = await githubApi.put(
      `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
      {
        message: `Actualiza ${path}`,
        content: Buffer.from(content).toString('base64'),
        sha: sha || undefined
      }
    );
    res.json({ ok: true, sha: response.data.content.sha });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: 'Error guardando el archivo en GitHub' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
