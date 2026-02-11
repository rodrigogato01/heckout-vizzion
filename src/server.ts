import express from 'express';
import cors from 'cors';
import { PixService } from './services/PixService';
import axios from 'axios'; // Para a Vizzion Pay

const app = express();

app.use(express.json());
app.use(cors());

// Instancia o seu serviço (que usa a nova lib do Mercado Pago)
const pixService = new PixService();

// =================================================
// ROTA 1: MERCADO PAGO (IOF - Taxa Pequena)
// =================================================
app.post('/pix', async (req, res) => {
    const { amount, name, cpf } = req.body;

    try {
        // CORREÇÃO: Chama 'createCharge' em vez de 'createPix'
        const response = await pixService.createCharge(Number(amount), String(name), String(cpf));
        
        // O Mercado Pago v2 retorna a resposta dentro de .id, .point_of_interaction, etc.
        res.status(201).json(response);

    } catch (error: any) {
        console.error("Erro Rota /pix (MP):", error);
        res.status(500).json({ error: "Erro ao criar Pix do IOF" });
    }
});

app.get('/pix/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // CORREÇÃO: Chama 'checkStatus' em vez de 'getPixStatus'
        const status = await pixService.checkStatus(id);
        
        // Retorna no formato que o front espera
        res.status(200).json({ status: status }); 
    } catch (error: any) {
        res.status(500).json({ error: "Erro ao consultar status" });
    }
});

// =================================================
// ROTA 2: VIZZION PAY (Checkout Final - Curso)
// =================================================
app.post('/vizzion-pix', async (req, res) => {
    const { amount, name, email, cpf } = req.body;
    
    // SUA CHAVE SECRETA VIZZION
    const SECRET_KEY = 'e08f7qe1x8zjbnx4dkra9p8v7uj1wfacwidsnnf4lhpfq3v8oz628smahn8g6kus';
    const API_URL = 'https://api.vizzionpay.com/v1/pix'; 

    try {
        console.log(`🚀 Vizzion Pix para: ${name}`);

        const payload = {
            amount: Math.round(Number(amount) * 100), // Centavos
            payer: {
                name: String(name),
                email: String(email),
                document: String(cpf).replace(/\D/g, '')
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
        
        // Retorna dados para o front (ajustando conforme o retorno da Vizzion)
        res.status(200).json({
            transaction_id: data.id,
            qrcode_image: data.qr_code_base64 || data.qrcode || data.point_of_interaction?.transaction_data?.qr_code_base64,
            pix_copy_paste: data.pix_copy_paste || data.copia_e_cola || data.point_of_interaction?.transaction_data?.qr_code
        });

    } catch (error: any) {
        console.error("❌ Erro Vizzion:", error.response?.data || error.message);
        res.status(500).json({ error: "Falha na Vizzion Pay" });
    }
});

// Inicialização
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});