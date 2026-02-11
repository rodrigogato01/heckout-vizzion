import express from 'express';
import cors from 'cors';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import axios from 'axios';

const app = express();
app.use(express.json());
app.use(cors({ origin: '*' }));

// === CONFIGURAÇÃO MERCADO PAGO ===
// Seu Token de Acesso
const client = new MercadoPagoConfig({ accessToken: 'APP_USR-2572776399339396-020516-e4fefa77579bb50393285e683713d789-232650059' });
const payment = new Payment(client);

// Rota de Teste
app.get('/', (req, res) => res.send('Servidor Online 100%'));

// === ROTA 1: MERCADO PAGO (CORRIGIDA) ===
app.post('/pix', async (req, res) => {
    try {
        const { amount, name, cpf, email } = req.body;

        console.log(`🔹 Gerando Pix MP: ${name} | R$ ${amount}`);

        const paymentData = {
            transaction_amount: Number(amount),
            description: 'Taxa de Liberação',
            payment_method_id: 'pix',
            payer: {
                // MP exige email. Se não vier, usamos um padrão.
                email: email || 'pagamento@email.com',
                first_name: String(name).split(' ')[0],
                last_name: String(name).split(' ').slice(1).join(' ') || 'Cliente',
                identification: {
                    type: 'CPF',
                    number: String(cpf).replace(/\D/g, '') // Remove pontos/traços
                }
            }
        };

        const result = await payment.create({ body: paymentData });
        
        console.log("✅ Pix MP Criado com Sucesso:", result.id);
        res.status(201).json(result);

    } catch (error: any) {
        console.error("❌ Erro Mercado Pago:", error);
        
        // Retorna o erro detalhado para o navegador (F12)
        res.status(500).json({ 
            error: "Erro ao criar Pix", 
            detalhes: error.message || error,
            api_response: error.cause || "Sem detalhes da API"
        });
    }
});

// === ROTA 2: VIZZION PAY ===
app.post('/vizzion-pix', async (req, res) => {
    try {
        const { name, email, cpf } = req.body;
        const SECRET = 'e08f7qe1x8zjbnx4dkra9p8v7uj1wfacwidsnnf4lhpfq3v8oz628smahn8g6kus';

        console.log(`🚀 Pix Vizzion Solicitado: ${name}`);

        const response = await axios.post('https://api.vizzionpay.com/v1/pix', {
            amount: 14790, // R$ 147,90 (em centavos)
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
        console.error("❌ Erro Vizzion:", error.message);
        res.status(500).json({ error: "Erro Vizzion", detalhe: error.message });
    }
});

// Inicialização
const PORT = Number(process.env.PORT) || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});