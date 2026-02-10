import express from 'express';
import cors from 'cors';
import path from 'path';
import { PixController } from './controllers/PixController';

const app = express();
const pixController = new PixController();

app.use(cors());
app.use(express.json());

// --- AQUI ESTÁ A CORREÇÃO: LIBERAR ARQUIVOS ESTÁTICOS (IMAGENS) ---
// Isso permite que o banner.jpg seja acessado pelo navegador
app.use(express.static(path.resolve(__dirname, '..')));

// --- ROTAS DA API ---
app.post('/pix', pixController.create);
app.get('/pix/:id', pixController.checkStatus);
app.post('/webhook', pixController.webhook);

// --- ROTA PRINCIPAL ---
const publicPath = path.resolve(__dirname, '..', 'index.html');
app.get('/', (req, res) => {
    res.sendFile(publicPath);
});

// --- ROTA CHECKOUT IOF ---
const iofPath = path.resolve(__dirname, '..', 'iof.html');
app.get('/iof.html', (req, res) => {
    res.sendFile(iofPath);
});

const PORT = process.env.PORT || 3000;
app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});