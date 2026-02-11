import express from 'express';
import cors from 'cors';
import { PixService } from './services/PixService';
import axios from 'axios'; 

const app = express();

app.use(express.json());

// === CORREÇÃO CRÍTICA DE CORS ===
// Isso permite que o seu checkout final acesse o servidor sem ser bloqueado
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Serviço do Mercado Pago (IOF)
const pixService = new PixService();

// =================================================
// ROTA 1: MERCADO PAGO (IOF - Taxa Pequena)
// =================================================
app.post('/pix', async (req, res) => {
    const { amount, name, cpf } = req.body;
    try {
        // Usa o método novo 'createCharge' que vimos no seu arquivo
        const response = await pixService.createCharge(Number(amount), String(name), String(cpf));
        res.status(201).json(response);
    } catch (error: any) {
        console.error("Erro MP:", error);
        res.status(500).json({ error: "Erro ao criar Pix IOF" });
    }
});

app.get('/pix/:id', async (req, res) => {
    try {
        const status = await pixService.checkStatus(req.params.id);
        res.status(200).json({ status }); 
    } catch (error: any) {
        res.status(500).json({ error: "Erro status" });
    }
});

// =================================================
// ROTA 2: VIZZION PAY (Checkout Final - Dinheiro Real)
// =================================================
// Se esta rota não existir, dá erro 404!
app.post('/vizzion-pix', async (req, res) => {
    const { amount, name, email, cpf } = req.body;
    
    // SUA CHAVE SECRETA VIZZION
    const SECRET_KEY = 'e08f7qe1x8zjbnx4dkra9p8v7uj1wfacwidsnnf4lhpfq3v8oz628smahn8g6kus';
    const API_URL = 'https://api.vizzionpay.com/v1/pix'; 

    try {
        console.log(`🚀 Criando Pix Vizzion para: ${name}`);

        const payload = {
            amount: 14790, // Valor FIXO em centavos (R$ 147,90)
            payer: {
                name: String(name),
                email: String(email),
                document: String(cpf).replace(/\D/g, '') // Apenas números
            },
            payment_method: "pix"
        };

        const response = await axios.post(API_URL, payload, {
            headers: {
                'Authorization': `Bearer ${SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const data = response.data;
        console.log("✅ Pix Vizzion ID:", data.id);
        
        // Retorna o JSON correto para o HTML
        res.status(200).json({
            transaction_id: data.id,
            qrcode_image: data.qr_code_base64 || data.qrcode || data.point_of_interaction?.transaction_data?.qr_code_base64,
            pix_copy_paste: data.pix_copy_paste || data.copia_e_cola || data.point_of_interaction?.transaction_data?.qr_code
        });

    } catch (error: any) {
        console.error("❌ Erro Vizzion:", error.response?.data || error.message);
        res.status(500).json({ 
            error: "Falha na Vizzion Pay",
            details: error.response?.data 
        });
    }
});

// Inicialização
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});