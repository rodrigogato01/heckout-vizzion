import express from 'express';
import cors from 'cors';
import { PixService } from './services/PixService';
import axios from 'axios';

const app = express();
app.use(express.json());

// LIBERA TUDO (CORS)
app.use(cors({ origin: '*' }));

// Rota de Teste (Para saber se o servidor está vivo)
app.get('/', (req, res) => {
    res.send('Servidor Online e Rodando! Rota Vizzion ativa.');
});

// Serviço MP
const pixService = new PixService();

// --- ROTA VIZZION PAY (Onde estava dando erro 404) ---
app.post('/vizzion-pix', async (req, res) => {
    console.log("🔔 Chamada recebida em /vizzion-pix");
    const { name, email, cpf } = req.body;
    
    const SECRET = 'e08f7qe1x8zjbnx4dkra9p8v7uj1wfacwidsnnf4lhpfq3v8oz628smahn8g6kus';
    
    try {
        // Payload oficial Vizzion
        const payload = {
            amount: 14790, // R$ 147,90
            payment_method: "pix",
            payer: {
                name: String(name),
                email: String(email),
                document: String(cpf).replace(/\D/g, '')
            }
        };

        const response = await axios.post('https://api.vizzionpay.com/v1/pix', payload, {
            headers: {
                'Authorization': `Bearer ${SECRET}`,
                'Content-Type': 'application/json'
            }
        });

        console.log("✅ Pix Vizzion Gerado:", response.data.id);
        
        // Devolve JSON
        res.json({
            qr_copia: response.data.pix_copy_paste || response.data.copia_e_cola || response.data.qr_code,
            qr_imagem: response.data.qr_code_base64 || response.data.qrcode_image
        });

    } catch (error: any) {
        console.error("❌ Erro Vizzion:", error.message);
        // Retorna erro JSON (não HTML) para o front entender
        res.status(500).json({ error: "Erro ao gerar Pix", detalhe: error.message });
    }
});

// --- ROTA MERCADO PAGO ---
app.post('/pix', async (req, res) => {
    try {
        const { amount, name, cpf } = req.body;
        const response = await pixService.createCharge(Number(amount), String(name), String(cpf));
        res.status(201).json(response);
    } catch (error) { res.status(500).json({ error: "Erro MP" }); }
});

app.get('/pix/:id', async (req, res) => {
    try {
        const status = await pixService.checkStatus(req.params.id);
        res.json({ status });
    } catch (error) { res.status(500).json({ error: "Erro Status" }); }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Rodando na porta ${PORT}`));