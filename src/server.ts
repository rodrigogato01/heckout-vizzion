import express, { Request, Response } from 'express';
import cors from 'cors';
import axios from 'axios';
import path from 'path';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();

// ==========================================
// CONFIGURAÇÃO CORS (CRÍTICO - ANTES DE TUDO)
// ==========================================
app.use(cors({ 
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Idempotency-Key'],
    credentials: true
}));

// TRATAR OPTIONS EXPLICITAMENTE (PREFLIGHT)
app.options('*', cors());

// Parser JSON
app.use(express.json());

// LOG para debug
console.log("🛠️  INICIANDO SERVIDOR...");
console.log("📍 Diretório atual:", __dirname);

// ==========================================
// ROTAS DA API (VEM PRIMEIRO!)
// ==========================================

// ROTA POST /pix (GERAR PIX)
app.post('/pix', async (req: Request, res: Response) => {
    console.log("🔔 [POST] /pix ACIONADO!");
    console.log("📦 Dados recebidos:", req.body);

    try {
        const { amount, name, cpf, email } = req.body;

        // Pegar token do .env (SEGURANÇA!)
        const ACCESS_TOKEN = process.env.MERCADO_PAGO_TOKEN;
        
        if (!ACCESS_TOKEN) {
            console.error("❌ Token do Mercado Pago não configurado!");
            return res.status(500).json({ 
                error: "Configuração incompleta",
                message: "Token não configurado no servidor" 
            });
        }

        // Validar dados
        if (!name || !cpf) {
            return res.status(400).json({
                error: "Dados inválidos",
                message: "Nome e CPF são obrigatórios"
            });
        }

        const payload = {
            transaction_amount: Number(amount) || 37.90,
            description: "Taxa de Liberação Shopee",
            payment_method_id: "pix",
            payer: {
                email: (email && email.includes('@')) ? email : "cliente@email.com",
                first_name: String(name).split(' ')[0] || "Cliente",
                last_name: String(name).split(' ').slice(1).join(' ') || "Sobrenome",
                identification: {
                    type: "CPF",
                    number: String(cpf).replace(/\D/g, '')
                }
            }
        };

        console.log("🚀 Enviando para Mercado Pago...");

        const response = await axios.post('https://api.mercadopago.com/v1/payments', payload, {
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
                'X-Idempotency-Key': `pix-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            },
            timeout: 30000 // 30 segundos timeout
        });

        console.log("✅ PIX CRIADO COM SUCESSO! ID:", response.data.id);
        
        // Retornar apenas dados necessários
        res.status(201).json({
            id: response.data.id,
            status: response.data.status,
            point_of_interaction: response.data.point_of_interaction
        });

    } catch (error: any) {
        console.error("❌ ERRO AO GERAR PIX:");
        console.error("Status:", error.response?.status);
        console.error("Dados:", error.response?.data);
        console.error("Mensagem:", error.message);

        res.status(500).json({ 
            error: "Erro ao gerar Pix",
            details: error.response?.data?.message || error.message,
            status: error.response?.status
        });
    }
});

// ROTA GET /status (VERIFICAÇÃO)
app.get('/status', (req: Request, res: Response) => {
    res.json({ 
        status: 'online', 
        version: '3.1',
        timestamp: new Date().toISOString()
    });
});

// ==========================================
// SERVIR ARQUIVOS ESTÁTICOS (DEPOIS DAS ROTAS API)
// ==========================================

// IMPORTANTE: Ajuste o caminho conforme sua estrutura
// Se index.html está na RAIZ (mesmo nível que src/):
app.use(express.static(path.resolve(__dirname, '../')));

// Se index.html está na pasta public/:
// app.use(express.static(path.resolve(__dirname, '../public')));

// ==========================================
// ROTA CORINGA (SPA - SINGLE PAGE APPLICATION)
// ==========================================
// Só captura GET, não intercepta POST/OPTIONS
app.get('*', (req: Request, res: Response) => {
    // Não intercepta rotas que começam com /pix ou /status
    if (req.path.startsWith('/pix') || req.path.startsWith('/status')) {
        return res.status(404).json({ error: "Rota não encontrada" });
    }
    
    res.sendFile(path.resolve(__dirname, '../index.html'));
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================
const PORT = Number(process.env.PORT) || 10000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📡 Rotas disponíveis:`);
    console.log(`   POST http://localhost:${PORT}/pix`);
    console.log(`   GET  http://localhost:${PORT}/status`);
    console.log(`   GET  http://localhost:${PORT}/ (frontend)`);
    
    if (!process.env.MERCADO_PAGO_TOKEN) {
        console.warn("⚠️  AVISO: MERCADO_PAGO_TOKEN não definido no .env!");
    }
});