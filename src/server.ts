import express from 'express';
import cors from 'cors';
import { PixService } from './services/PixService';
import axios from 'axios';

const app = express();
app.use(express.json());

// 1. CORS LIBERADO GERAL (Para não bloquear seu checkout)
app.use(cors({ origin: '*' }));

// 2. ROTA DE SINAL DE VIDA (Obrigatória para Render não dar Timeout)
app.get('/', (req, res) => {
    res.status(200).send('Servidor Online e Pronto!');
});

// Serviço Mercado Pago
const pixService = new PixService();

// =========================================
// ROTA 1: VIZZION PAY (Checkout Final)
// =========================================
app.post('/vizzion-pix', async (req, res) => {
    const { name, email, cpf } = req.body;
    
    // SUA CHAVE SECRETA
    const SECRET = 'e08f7qe1x8zjbnx4dkra9p8v7uj1wfacwidsnnf4lhpfq3v8oz628smahn8g6kus';
    
    console.log(`🚀 Iniciando Pix Vizzion para: ${name}`);

    try {
        const payload = {
            amount: 14790, // R$ 147,90
            payment_method: "pix",
            payer: {
                name: String(name),
                email: String(email),
                document: String(cpf).replace(/\D/g, '')
            }
        };

        // Timeout de 20s para evitar que o servidor fique travado esperando
        const response = await axios.post('https://api.vizzionpay.com/v1/pix', payload, {
            headers: {
                'Authorization': `Bearer ${SECRET}`,
                'Content-Type': 'application/json'
            },
            timeout: 20000 
        });

        console.log("✅ Vizzion Sucesso ID:", response.data.id);
        
        res.json({
            qr_imagem: response.data.qr_code_base64 || response.data.qrcode || response.data.point_of_interaction?.transaction_data?.qr_code_base64,
            qr_copia: response.data.pix_copy_paste || response.data.copia_e_cola || response.data.point_of_interaction?.transaction_data?.qr_code
        });

    } catch (error: any) {
        console.error("❌ Erro Vizzion:", error.response?.data || error.message);
        // Retorna erro JSON para o front saber o que houve
        res.status(500).json({ 
            error: "Falha na Vizzion Pay", 
            detalhes: error.response?.data || error.message 
        });
    }
});

// =========================================
// ROTA 2: MERCADO PAGO (Taxa IOF)
// =========================================
app.post('/pix', async (req, res) => {
    try {
        const { amount, name, cpf } = req.body;
        const response = await pixService.createCharge(Number(amount), String(name), String(cpf));
        res.status(201).json(response);
    } catch (error: any) {
        console.error("Erro MP:", error);
        res.status(500).json({ error: "Erro Mercado Pago" });
    }
});

app.get('/pix/:id', async (req, res) => {
    try {
        const status = await pixService.checkStatus(req.params.id);
        res.status(200).json({ status });
    } catch (error) { res.status(500).json({ error: "Erro Status" }); }
});

// Inicialização
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});