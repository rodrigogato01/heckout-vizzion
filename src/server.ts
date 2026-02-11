import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid'; // Vamos gerar ID único para evitar duplicidade

const app = express();
app.use(express.json());
app.use(cors({ origin: '*' })); // Libera tudo

// Rota de Teste
app.get('/', (req, res) => res.send('Servidor Online (Modo Axios)'));

// =================================================
// ROTA 1: MERCADO PAGO (VIA AXIOS - MAIS ESTÁVEL)
// =================================================
app.post('/pix', async (req, res) => {
    const { amount, name, cpf, email } = req.body;
    
    // SEU TOKEN DE PRODUÇÃO
    const ACCESS_TOKEN = 'APP_USR-2572776399339396-020516-e4fefa77579bb50393285e683713d789-232650059';

    console.log(`🔹 Tentando MP Pix: ${name} | CPF: ${cpf} | R$ ${amount}`);

    try {
        // 1. Prepara os dados do jeito que o MP gosta
        const data = {
            transaction_amount: Number(amount),
            description: "Taxa de Liberacao",
            payment_method_id: "pix",
            payer: {
                email: email || "pagamento@shopee-resgate.com", // Email obrigatório
                first_name: String(name).split(' ')[0],
                last_name: String(name).split(' ').slice(1).join(' ') || "Cliente",
                identification: {
                    type: "CPF",
                    number: String(cpf).replace(/\D/g, '') // Remove pontos e traços
                }
            }
        };

        // 2. Faz a chamada manual (sem SDK)
        const response = await axios.post('https://api.mercadopago.com/v1/payments', data, {
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
                'X-Idempotency-Key': uuidv4() // Garante que não duplique pagamentos
            }
        });

        console.log("✅ Pix MP Gerado:", response.data.id);
        res.status(201).json(response.data);

    } catch (error: any) {
        // AQUI ESTÁ O SEGREDO DO DIAGNÓSTICO
        const erroMP = error.response ? error.response.data : error.message;
        console.error("❌ Erro Mercado Pago:", JSON.stringify(erroMP, null, 2));
        
        // Devolve o erro real para você ver no navegador
        res.status(error.response ? error.response.status : 500).json({
            error: "Falha ao criar Pix no Mercado Pago",
            motivo: erroMP
        });
    }
});

// =================================================
// ROTA 2: VIZZION PAY
// =================================================
app.post('/vizzion-pix', async (req, res) => {
    const { name, email, cpf, amount } = req.body;
    const SECRET = 'e08f7qe1x8zjbnx4dkra9p8v7uj1wfacwidsnnf4lhpfq3v8oz628smahn8g6kus';
    
    // Converte R$ 1,00 para 100 centavos se necessário, ou usa fixo
    const valorFinal = amount ? Number(amount) : 14790; 

    try {
        const response = await axios.post('https://api.vizzionpay.com/v1/pix', {
            amount: valorFinal, 
            payment_method: "pix",
            payer: {
                name: String(name),
                email: String(email || 'cliente@email.com'),
                document: String(cpf).replace(/\D/g, '')
            }
        }, {
            headers: { 'Authorization': `Bearer ${SECRET}` },
            timeout: 20000 
        });

        res.json({
            qr_imagem: response.data.qr_code_base64 || response.data.qrcode,
            qr_copia: response.data.pix_copy_paste || response.data.copia_e_cola
        });

    } catch (error: any) {
        console.error("Erro Vizzion:", error.message);
        res.status(500).json({ error: "Erro Vizzion" });
    }
});

const PORT = Number(process.env.PORT) || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`Rodando na porta ${PORT}`));