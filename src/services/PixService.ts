import { MercadoPagoConfig, Payment, PaymentRefund } from 'mercadopago';

// 1. Configuração Segura
const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || '', 
    options: { timeout: 5000 }
});

const payment = new Payment(client);
const refundClient = new PaymentRefund(client); // <--- CRIAMOS O ESPECIALISTA EM REEMBOLSO

export class PixService {
    
    // Método 1: Cria o PIX
    async createCharge(amount: number, name: string, cpf: string) {
        const cleanCpf = cpf.replace(/\D/g, '');

        try {
            const request = await payment.create({
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
            return request;
        } catch (error) {
            console.error("❌ Erro ao criar PIX:", error);
            throw new Error("Falha no Mercado Pago");
        }
    }

    // Método 2: Verifica Status
    async checkStatus(id: string) {
        try {
            const response = await payment.get({ id: id });
            return response.status; 
        } catch (error) {
            return 'error';
        }
    }

    // Método 3: Faz o Estorno (AGORA CORRIGIDO)
    async refund(id: string | number) {
        try {
            console.log(`💸 Processando estorno para o ID: ${id}...`);
            
            // AQUI ESTAVA O ERRO:
            // Em vez de usar payment.refund, usamos refundClient.create
            await refundClient.create({
                body: {
                    payment_id: id // O ID do pagamento vai aqui dentro agora
                }
            } as any); 
            
            console.log(`✅ Estorno confirmado para o ID ${id}`);
            return true;
        } catch (error) {
            console.error(`❌ Falha ao estornar ID ${id}:`, error);
            return false;
        }
    }
}