import express from 'express';
import cors from 'cors';
import path from 'path';
import { PixController } from './controllers/PixController';

const app = express();
const pixController = new PixController();

app.use(cors());
app.use(express.json());

// --- ROTAS DA API ---
app.post('/pix', pixController.create);
app.get('/pix/:id', pixController.checkStatus);
app.post('/webhook', pixController.webhook);

// --- ROTA 1: SITE PRINCIPAL ---
const publicPath = path.resolve(__dirname, '..', 'index.html');
app.get('/', (req, res) => {
    res.sendFile(publicPath);
});

// --- ROTA 2: CHECKOUT IOF ---
const iofPath = path.resolve(__dirname, '..', 'iof.html');
app.get('/iof.html', (req, res) => {
    res.sendFile(iofPath);
});

// --- ROTA 3: IMAGEM DO BANNER (NOVO) ---
// Isso permite que o site carregue a imagem 'banner.jpg'
const bannerPath = path.resolve(__dirname, '..', 'banner.jpg');
app.get('/banner.jpg', (req, res) => {
    res.sendFile(bannerPath, (err) => {
        if (err) res.status(404).send("Imagem não encontrada. Verifique se o arquivo 'banner.jpg' está na pasta.");
    });
});

const PORT = process.env.PORT || 3000;
app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});