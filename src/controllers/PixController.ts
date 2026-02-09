import { Request, Response } from 'express';
import { MercadoPagoConfig, Payment, PaymentRefund } from 'mercadopago';

// Configuração do Mercado Pago
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
                    description: `Pagamento Verificado - R$ ${amount}`,
                    payment_method_id: 'pix',
                    payer: {
                        email: 'cliente@verificado.com',
                        first_name: name,
                        identification: {
                            type: 'CPF',
                            number: cpf.replace(/\D/g, '') // Garante apenas números
                        }
                    },
                    // SEU LINK NA RENDER
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
        const refund = new PaymentRefund(client);
        const { action, data } = req.body;

        try {
            if (action === 'payment.updated') {
                const pay = await payment.get({ id: String(data.id) });

                if (pay.status === 'approved') {
                    // Se vier vazio, assume 0
                    const valorPago = pay.transaction_amount || 0;
                    
                    console.log(`✅ Pagamento de R$ ${valorPago} APROVADO!`);

                    // --- LISTA VIP DE ESTORNO AUTOMÁTICO ---
                    // Apenas estes valores voltam. O resto fica no seu bolso.
                    const valoresParaReembolso = [37.90, 47.90]; 

                    if (valoresParaReembolso.includes(valorPago)) {
                        console.log(`🔄 Valor R$ ${valorPago} identificado para Reembolso. Iniciando...`);
                        
                        await refund.create({
                            payment_id: String(data.id),
                            body: {
                                amount: valorPago
                            }
                        });
                        
                        console.log('💸 Estorno realizado com sucesso!');
                    } else {
                        console.log(`💰 VENDA REAL! R$ ${valorPago} mantido na conta.`);
                    }
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
            const result = await payment.get({ id: String(id) }); 
            return res.json({ status: result.status });
        } catch (error) {
            return res.status(404).json({ status: 'error' });
        }
    }
}