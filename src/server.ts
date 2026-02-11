import express from 'express';
import cors from 'cors';
import axios from 'axios';
import path from 'path';

const app = express();

app.use(express.json());
app.use(cors({ origin: '*' }));

// === LOG PARA PROVAR QUE A ROTA EXISTE ===
console.log("🛠️  CRIANDO ROTA /pix ...");

// 1. ROTA API PIX (PRIORIDADE MÁXIMA)
app.post('/pix', async (req, res) => {
    console.log("🔔 [POST] /pix ACIONADO!");
    console.log("📦 Dados:", req.body);

    try {
        const { amount, name, cpf, email } = req.body;

        // TOKEN NOVO QUE VOCÊ MANDOU
        const ACCESS_TOKEN = 'APP_USR-7433336192149093-020423-97cd4e2614f56c0f43836231bfb0e432-202295570';

        const payload = {
            transaction_amount: Number(amount) || 37.90,
            description: "Taxa Liberacao",
            payment_method_id: "pix",
            payer: {
                email: (email && email.includes('@')) ? email : "pagamento@shopee.com",
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

        console.log("✅ PIX CRIADO COM SUCESSO: ID", response.data.id);
        res.status(201).json(response.data);

    } catch (error: any) {
        console.error("❌ ERRO MP:", error.response?.data || error.message);
        res.status(500).json({ error: "Erro Pix", detalhes: error.response?.data });
    }
});

// 2. ROTA DE STATUS
app.get('/status', (req, res) => {
    res.send('SERVIDOR ONLINE E ATUALIZADO (V3.0)');
});

// 3. SERVIR ARQUIVOS DO SITE (FRONTEND)
// A pasta raiz './' contém o index.html
app.use(express.static(path.resolve(__dirname, '../')));

// 4. ROTA CORINGA (MANDA TUDO PRO SITE)
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../index.html'));
});

const PORT = Number(process.env.PORT) || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📡 Rota POST /pix disponível.`);
});