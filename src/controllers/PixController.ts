import { Request, Response } from 'express';
// CORREÇÃO 1: Mudamos 'Refund' para 'PaymentRefund' 👇
import { MercadoPagoConfig, Payment, PaymentRefund } from 'mercadopago'; 

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || ''
});

export class PixController {
    
    async create(req: Request, res: Response) {
        const payment = new Payment(client);
        
        try {
            const { amount, name, cpf } = req.body;

            const result = await payment.create({
                body: {
                    transaction_amount: parseFloat(amount),
                    description: 'Teste de Estorno Pix',
                    payment_method_id: 'pix',
                    payer: {
                        email: 'teste@email.com',
                        first_name: name,
                        identification: {
                            type: 'CPF',
                            number: cpf
                        }
                    },
                    notification_url: 'https://checkout-pix-profissional.onrender.com/webhook'
                }
            });

            return res.status(201).json(result);

        } catch (error: any) {
            console.error('Erro ao criar Pix:', error);
            return res.status(500).json({ error: 'Erro ao criar Pix' });
        }
    }

    async webhook(req: Request, res: Response) {
        const payment = new Payment(client);
        // CORREÇÃO 2: Usamos a classe certa 'PaymentRefund' 👇
        const refund = new PaymentRefund(client); 
        const { action, data } = req.body;

        try {
            if (action === 'payment.created') {
                console.log('🔔 Pix Criado:', data.id);
            }

            if (action === 'payment.updated') {
                // CORREÇÃO 3: Forçamos o ID ser string para não dar erro
                const pay = await payment.get({ id: String(data.id) });

                if (pay.status === 'approved') {
                    console.log(`✅ Pagamento ${pay.id} APROVADO! Iniciando estorno...`);
                    
                    // CORREÇÃO 4: O jeito certo de criar o estorno
                    await refund.create({
                        payment_id: String(data.id), // ID vai aqui fora
                        body: {
                            amount: pay.transaction_amount // Valor vai aqui dentro
                        }
                    });
                    
                    console.log('💸 Estorno realizado com sucesso!');
                }
            }

            return res.status(200).send();

        } catch (error) {
            console.error('Erro no Webhook:', error);
            return res.status(500).send();
        }
    }

    async checkStatus(req: Request, res: Response) {
        const payment = new Payment(client);
        try {
            const { id } = req.params;
            // CORREÇÃO 5: Forçamos o ID ser string aqui também
            const result = await payment.get({ id: String(id) }); 
            return res.json({ status: result.status });
        } catch (error) {
            return res.status(404).json({ status: 'error' });
        }
    }
}