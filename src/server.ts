import express from 'express';
import cors from 'cors';
import path from 'path'; 
import { router } from './routes';

const app = express();

app.use(cors());
app.use(express.json());

// A CORREÇÃO MÁGICA 👇
// process.cwd() pega a raiz do projeto. Juntamos com 'index.html'
const publicPath = path.join(process.cwd(), 'index.html');

app.use(router);

// Rota para entregar o site
app.get('/', (req, res) => {
    res.sendFile(publicPath);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));