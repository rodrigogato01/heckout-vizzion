import express from 'express';
import cors from 'cors';
import { PixService } from './services/PixService';
import axios from 'axios';

const app = express();
app.use(express.json());

// Libera conexões de fora
app.use(cors({ origin: '*' }));

// Rota para a Render saber que o servidor está vivo
app.get('/', (req, res) => {
    res.status(200).send('Servidor Online e Pronto!');
});

const pixService = new PixService();

// --- ROTA VIZZION ---
app.post('/vizzion-pix', async (req, res) => {
    const { name, email, cpf } = req.body;
    const SECRET = 'e08f7qe1x8zjbnx4dkra9p8v7uj1wfacwidsnnf4lhpfq3v8oz628smahn8g6kus';
    
    console.log(`🚀 Pix Vizzion: ${name}`);

    try {
        const response = await axios.post('https://api.vizzionpay.com/v1/pix', {
            amount: 14790, 
            payment_method: "pix",
            payer: {
                name: String(name),
                email: String(email),
                document: String(cpf).replace(/\D/g, '')
            }
        }, {
            headers: { 'Authorization': `Bearer ${SECRET}` },
            timeout: 20000 
        });

        res.json({
            qr_imagem: response.data.qr_code_base64 || response.data.qrcode || response.data.point_of_interaction?.transaction_data?.qr_code_base64,
            qr_copia: response.data.pix_copy_paste || response.data.copia_e_cola || response.data.point_of_interaction?.transaction_data?.qr_code
        });

    } catch (error: any) {
        console.error("❌ Erro Vizzion:", error.message);
        res.status(500).json({ error: "Falha na Vizzion", detalhe: error.message });
    }
});

// --- ROTA MERCADO PAGO ---
app.post('/pix', async (req, res) => {
    try {
        const { amount, name, cpf } = req.body;
        const response = await pixService.createCharge(Number(amount), String(name), String(cpf));
        res.status(201).json(response);
    } catch (error: any) {
        res.status(500).json({ error: "Erro MP" });
    }
});

app.get('/pix/:id', async (req, res) => {
    try {
        const status = await pixService.checkStatus(req.params.id);
        res.json({ status });
    } catch (error) { res.status(500).json({ error: "Erro Status" }); }
});

// Inicialização Padrão (Sem IP fixo para evitar erro)
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});