import express from 'express'; // <--- Faltava importar
import cors from 'cors';       // <--- Faltava importar
import path from 'path';       // <--- Faltava importar
import 'dotenv/config';        // <--- Carrega o arquivo .env para todo o projeto
import { router } from './routes'; // <--- Faltava importar suas rotas

const app = express();

// Configurações do Servidor
app.use(cors());
app.use(express.json());

// Configura a pasta pública (onde fica o site bonito)
app.use(express.static(path.join(__dirname, '../public')));

// Usa as rotas que criamos (PixController, etc)
app.use(router);

// Configuração de Porta (Importante para o Deploy na Render)
// Se estiver no PC usa 3000, se estiver na Render usa a porta que eles mandarem
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Sistema rodando na porta ${PORT}`);
});