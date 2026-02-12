import express from 'express';
import cors from 'cors';
import axios from 'axios';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// CORS
app.use(cors({ origin: '*' }));
app.use(express.json());

// ROTA DE TESTE (ADICIONADA!)
app.get('/status', (req, res) => {
    res.json({ status: 'online', version: '3.1', timestamp: new Date().toISOString() });
});

// ROTA PIX
app.post('/pix', async (req, res) => {
    console.log("POST /pix recebido:", req.body);
    
    try {
        const { amount, name, cpf } = req.body;
        const ACCESS_TOKEN = process.env.MERCADO_PAGO_TOKEN;

        if (!ACCESS_TOKEN) {
            return res.status(500).json({ error: "Token não configurado" });
        }

        const payload = {
            transaction_amount: Number(amount) || 37.90,
            description: "Taxa Liberacao",
            payment_method_id: "pix",
            payer: {
                email: "cliente@email.com",
                first_name: String(name).split(' ')[0] || "Cliente",
                last_name: String(name).split(' ').slice(1).join(' ') || "Sobrenome",
                identification: {
                    type: "CPF",
                    number: String(cpf).replace(/\D/g, '')
                }
            }
        };

        const response = await axios.post('https://api.mercadopago.com/v1/payments', payload, {
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
                'X-Idempotency-Key': `pix-${Date.now()}`
            }
        });

        console.log("Pix criado:", response.data.id);
        res.status(201).json(response.data);

    } catch (error: any) {
        console.error("Erro:", error.response?.data || error.message);
        res.status(500).json({ error: "Erro ao gerar Pix", details: error.response?.data });
    }
});

// Servir arquivos estáticos
app.use(express.static(path.resolve(__dirname, '../')));

// Rota coringa
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});