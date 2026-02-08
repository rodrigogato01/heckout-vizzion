import express from 'express';
import cors from 'cors';
import path from 'path'; // Importação obrigatória
import { router } from './routes';

const app = express();

app.use(cors());
app.use(express.json());

// CAMINHO BLINDADO 👇
// __dirname = pasta dist. O '..' volta para a raiz.
const publicPath = path.resolve(__dirname, '..', 'index.html');

app.use(router);

app.get('/', (req, res) => {
    // Tenta entregar o arquivo. Se der erro, avisa no navegador.
    res.sendFile(publicPath, (err) => {
        if (err) {
            res.status(500).send(`Erro ao achar arquivo: ${err.message}`);
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));