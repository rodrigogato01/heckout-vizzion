import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
app.use(express.json());
app.use(cors({ origin: '*' }));

// Rota de Teste Simples
app.get('/', (req, res) => {
    res.send('Servidor em Modo Diagnóstico: ON');
});

// === ROTA DO PIX (MODO DEBUG) ===
app.post('/pix', async (req, res) => {
    console.log("------------------------------------------------");
    console.log("🔍 [DIAGNOSTICO] Recebendo pedido de Pix...");
    console.log("📦 Dados recebidos do Front:", JSON.stringify(req.body));

    const { amount, name, cpf, email } = req.body;
    const ACCESS_TOKEN = 'APP_USR-2572776399339396-020516-e4fefa77579bb50393285e683713d789-232650059';

    try {
        // Preparando dados (Hardcoded para teste se necessário, mas usando variáveis)
        const payload = {
            transaction_amount: Number(amount) || 37.90, // Garante numero
            description: "Taxa Teste",
            payment_method_id: "pix",
            payer: {
                email: email || "teste@diagnostico.com",
                first_name: String(name).split(' ')[0] || "Debug",
                last_name: "User",
                identification: {
                    type: "CPF",
                    number: String(cpf).replace(/\D/g, '') // Remove pontuacao
                }
            }
        };

        console.log("🚀 Enviando para Mercado Pago:", JSON.stringify(payload));

        const response = await axios.post('https://api.mercadopago.com/v1/payments', payload, {
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
                'X-Idempotency-Key': `debug-${Date.now()}` // Chave unica simples
            }
        });

        console.log("✅ SUCESSO! ID:", response.data.id);
        res.status(201).json(response.data);

    } catch (error: any) {
        console.log("❌ ============ ERRO CAPTURADO ============");
        
        if (error.response) {
            // O Mercado Pago respondeu com um erro (AQUI ESTÁ A RESPOSTA)
            console.log("⚠️ Status HTTP:", error.response.status);
            console.log("⚠️ RESPOSTA DETALHADA MP:", JSON.stringify(error.response.data, null, 2));
            
            // Devolvemos isso para o navegador ver
            res.status(error.response.status).json({
                erro_tipo: "MercadoPago_Recusou",
                mensagem_original: error.response.data
            });
        } else {
            // Erro de conexão ou código
            console.log("⚠️ Erro Intern