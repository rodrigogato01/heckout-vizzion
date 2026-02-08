import { MercadoPagoConfig, Payment, PaymentRefund } from 'mercadopago';

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || '', 
    options: { timeout: 5000 }
});

const payment = new Payment(client);
const refundClient = new PaymentRefund(client);

export class PixService {
    // 1. Criar
    async createCharge(amount: number, name: string, cpf: string) {
        const cleanCpf = cpf.replace(/\D/g, '');
        try {
            return await payment.create({
                body: {
                    transaction_amount: amount,
                    description: `Venda - ${name}`,
                    payment_method_id: 'pix',
                    payer: {
                        email: 'cliente@email.com',
                        first_name: name,
                        identification: { type: 'CPF', number: cleanCpf }
                    }
                }
            });
        } catch (error) {
            throw new Error("Falha no Mercado Pago");
        }
    }

    // 2. Checar Status (Aceita texto e número)
    async checkStatus(id: string | number) {
        try {
            const response = await payment.get({ id: String(id) });
            return response.status; 
        } catch (error) {
            return 'error';
        }
    }

    // 3. Reembolsar (Aceita texto e número)
    async refund(id: string | number) {
        try {
            console.log(`Estornando ID: ${id}`);
            await refundClient.create({
                body: { payment_id: String(id) }
            } as any);
            return true;
        } catch (error) {
            console.error("Erro estorno", error);
            return false;
        }
    }
}