import express from 'express';
import cors from 'cors';
import axios from 'axios';
import path from 'path';

const app = express();

// 1. Configurações Básicas
app.use(express.json());
app.use(cors({ origin: '*' }));

// 2. Rota de Teste (Para saber se o deploy funcionou)
app.get('/status', (req, res) => {
    res.send('Servidor Online: Token Atualizado');
});

// ========================================================
// 3. ROTA DA API PIX (MERCADO PAGO)
// ========================================================
app.post('/pix', async (req, res) => {
    console.log("🔔 Pedido de Pix Iniciado...");
    console.log("📦 Dados recebidos:", req.body);

    try {
        const { amount, name, cpf, email } = req.body;
        
        // SEU NOVO TOKEN DE PRODUÇÃO
        const ACCESS_TOKEN = 'APP_USR-7433336192149093-020423-97cd4e2614f56c0f43836231bfb0e432-202295570';

        // Tratamento de dados para não dar erro no MP
        const cpfLimpo = String(cpf).replace(/\D/g, '');
        const primeiroNome = String(name).split(' ')[0] || "Cliente";
        const sobrenome = String(name).split(' ').slice(1).join(' ') || "Shopee";
        // Gera um email único se não vier, para evitar erro de "pagador duplicado"
        const emailFinal = (email && email.includes('@')) ? email : `pagamento.${Date.now()}@shopee.com`;

        const payload = {
            transaction_amount: Number(amount) || 37.90,
            description: "Taxa de Liberacao",
            payment_method_id: "pix",
            payer: {
                email: emailFinal,
                first_name: primeiroNome,
                last_name: sobrenome,
                identification: {
                    type: "CPF",
                    number: cpfLimpo
                }
            }
        };

        console.log("🚀 Enviando para Mercado Pago...");

        const response = await axios.post('https://api.mercadopago.com/v1/payments', payload, {
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
                'X-Idempotency-Key': `pix-${Date.now()}` // Evita cobrança duplicada no mesmo segundo
            }
        });

        console.log("✅ SUCESSO! Pix Gerado ID:", response.data.id);
        
        // Retorna apenas o necessário para o Frontend
        res.status(201).json(response.data);

    } catch (error: any) {
        // Se der erro, mostra DETALHES REAIS no console da Render
        const erroMP = error.response?.data;
        console.error("❌ ERRO MERCADO PAGO:", JSON.stringify(erroMP, null, 2));
        
        res.status(500).json({ 
            error: "Erro ao gerar Pix", 
            mensagem_mp: erroMP?.message || "Erro desconhecido",
            causa: erroMP?.cause
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

// 5. Inicialização
const PORT = Number(process.env.PORT) || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});