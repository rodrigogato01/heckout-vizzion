import express from 'express';
import cors from 'cors';
import axios from 'axios';
import path from 'path';

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// LOG para debug
console.log("🚀 Servidor iniciando...");
console.log("📍 Diretório:", __dirname);
console.log("🔑 Token existe?", !!process.env.MERCADO_PAGO_TOKEN);

// Rota de teste
app.get('/status', (req, res) => {
    res.json({ 
        status: 'online', 
        token_configurado: !!process.env.MERCADO_PAGO_TOKEN 
    });
});

// Rota PIX
app.post('/pix', async (req, res) => {
    console.log("📥 POST /pix recebido:", req.body);
    
    try {
        const { amount, name, cpf } = req.body;
        
        // Pega token do .env
        const ACCESS_TOKEN = process.env.MERCADO_PAGO_TOKEN;
        
        if (!ACCESS_TOKEN) {
            console.error("❌ TOKEN NÃO ENCONTRADO!");
            return res.status(500).json({ error: "Token não configurado no servidor" });
        }

        console.log("🚀 Criando Pix no Mercado Pago...");

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
            },
            timeout: 30000
        });

        console.log("✅ Pix criado! ID:", response.data.id);
        
        res.status(201).json({
            id: response.data.id,
            point_of_interaction: response.data.point_of_interaction
        });

    } catch (error: any) {
        console.error("❌ ERRO:", error.message);
        console.error("Detalhes:", error.response?.data);
        
        res.status(500).json({ 
            error: "Erro ao criar Pix", 
            message: error.message,
            details: error.response?.data 
        });
    }
});

// Arquivos estáticos
app.use(express.static(path.resolve(__dirname, '../')));

app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`✅ Servidor rodando na porta ${PORT}`);
});