import express from 'express';
import cors from 'cors';
import { PixService } from './services/PixService';
import axios from 'axios';

const app = express();
app.use(express.json());
app.use(cors({ origin: '*' })); // Libera acesso geral

// Rota para testar se o servidor está vivo
app.get('/', (req, res) => {
    res.send('Servidor Online! Rota Vizzion pronta.');
});

const pixService = new PixService();

// --- ROTA VIZZION PAY (COM DEBUG DETALHADO) ---
app.post('/vizzion-pix', async (req, res) => {
    const { name, email, cpf } = req.body;
    
    // SUA CHAVE
    const SECRET = 'e08f7qe1x8zjbnx4dkra9p8v7uj1wfacwidsnnf4lhpfq3v8oz628smahn8g6kus';
    
    // TENTATIVA 1: URL Padrão (Se falhar, vamos ver o erro)
    const URL = 'https://api.vizzionpay.com/v1/pix'; 

    console.log("------------------------------------------------");
    console.log(`🔎 Tentando criar Pix na Vizzion para: ${name}`);
    console.log(`📡 URL Alvo: ${URL}`);

    try {
        const payload = {
            amount: 14790, // Centavos
            payment_method: "pix",
            payer: {
                name: String(name),
                email: String(email),
                document: String(cpf).replace(/\D/g, '')
            }
        };

        const response = await axios.post(URL, payload, {
            headers: {
                'Authorization': `Bearer ${SECRET}`,
                'Content-Type': 'application/json'
            }
        });

        console.log("✅ SUCESSO VIZZION:", response.data);
        res.json(response.data);

    } catch (error: any) {
        // AQUI ESTÁ O SEGREDO: Pegar o erro exato da Vizzion
        const erroReal = error.response ? error.response.data : error.message;
        const statusErro = error.response ? error.response.status : 500;

        console.error("❌ ERRO VIZZION DETALHADO:", JSON.stringify(erroReal, null, 2));
        
        // Devolve o erro para o seu site mostrar no alerta
        res.status(statusErro).json({ 
            erro: "Falha na comunicação com Vizzion", 
            detalhes: erroReal,
            status: statusErro
        });
    }
});

// --- ROTA MERCADO PAGO (Mantida) ---
app.post('/pix', async (req, res) => {
    try {
        const { amount, name, cpf } = req.body;
        const response = await pixService.createCharge(Number(amount), String(name), String(cpf));
        res.status(201).json(response);
    } catch (error) { res.status(500).json({ error: "Erro MP" }); }
});

app.get('/pix/:id', async (req, res) => {
    try {
        const status = await pixService.checkStatus(req.params.id);
        res.json({ status });
    } catch (error) { res.status(500).json({ error: "Erro Status" }); }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Rodando na porta ${PORT}`));