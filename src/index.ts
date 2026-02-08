import { MercadoPagoConfig, Payment } from 'mercadopago';
import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';

// 1. CONFIGURAÇÃO (Seu Token)
const client = new MercadoPagoConfig({ 
  accessToken: 'APP_USR-6854982540328741-082022-24e5404b1a1394bcb305aec1572064eb-202295570',
  options: { timeout: 5000 }
});

const payment = new Payment(client);
const app = express();

// 2. CONEXÃO COM O SITE
app.use(cors());
app.use(express.json());
// Importante: '../public' assume que este arquivo server.ts está dentro da pasta src
app.use(express.static(path.join(__dirname, '../public'))); 

// 3. ROTA PARA CRIAR O PIX
app.post('/api/pagar', async (req: Request, res: Response) => {
  try {
    const { amount, name, cpf } = req.body;
    
    // Cria o pagamento
    const request = await payment.create({
      body: {
        transaction_amount: amount,
        description: `Pedido - ${name}`,
        payment_method_id: 'pix',
        payer: {
          email: 'cliente@teste.com',
          first_name: name,
          identification: { type: 'CPF', number: cpf.replace(/\D/g, '') }
        }
      }
    });

    // Se criou, monitora
    if(request.id) {
        monitorarPagamento(request.id);
    }

    // Responde ao site
    res.json({
      id: request.id,
      qr_code: request.point_of_interaction?.transaction_data?.qr_code
    });

  } catch (error: any) {
    console.error('❌ Erro MP:', error);
    res.status(500).json({ error: 'Erro ao gerar PIX' });
  }
});

// 4. ROTA DE STATUS
app.get('/api/status/:id', async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string; 
        const response = await payment.get({ id: id });
        res.json({ status: response.status });
    } catch (error) {
        res.status(404).json({ status: 'error' });
    }
});

// 5. ROBÔ DE ESTORNO BLINDADO
async function monitorarPagamento(id: string | number) {
    console.log(`👀 Monitorando ID: ${id}`);
    
    const intervalo = setInterval(async () => {
        try {
            // Verifica status
            const response = await payment.get({ id: id as any });

            if (response.status === 'approved') {
                console.log(`💰 PAGO! Estornando ID ${id}...`);
                clearInterval(intervalo);
                
                setTimeout(async () => {
                    try {
                        // A MÁGICA ESTÁ AQUI: Usamos 'payment_id' mas forçamos com 'as any'
                        // Isso obriga o sistema a aceitar o comando
                        await payment.refund({ payment_id: id } as any);
                        console.log(`✅ Dinheiro devolvido com sucesso!`);
                    } catch (err: any) {
                        console.error(`❌ Erro no estorno: ${err.message}`);
                    }
                }, 3000);
            }
        } catch (e) {
             // Silencia erros de conexão
        }
    }, 3000); // Checa a cada 3 segundos

    // Para de vigiar após 10 minutos
    setTimeout(() => clearInterval(intervalo), 600000);
}

// INICIALIZAR
app.listen(3000, () => {
  console.log('🚀 Servidor 100% Online em http://localhost:3000');
});