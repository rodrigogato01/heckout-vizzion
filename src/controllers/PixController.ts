import { Request, Response } from 'express';
import { PixService } from '../services/PixService';

const pixService = new PixService();

export class PixController {
    // Cria o PIX
    async create(req: Request, res: Response) {
        const { amount, name, cpf } = req.body;
        try {
            const result = await pixService.createCharge(Number(amount), name, cpf);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao criar PIX' });
        }
    }

    // Recebe o aviso do Banco (Webhook)
    async webhook(req: Request, res: Response) {
        const { data } = req.body;
        
        if (data && data.id) {
            const id = String(data.id); // <--- AQUI A CORREÇÃO: Forçamos virar texto

            console.log(`🔔 Webhook recebeu atualização do ID: ${id}`);

            // Verifica se foi pago e estorna
            try {
                const status = await pixService.checkStatus(id);
                if (status === 'approved') {
                    console.log("💰 Pagamento aprovado! Iniciando estorno...");
                    await pixService.refund(id);
                }
            } catch (e) {
                console.log("Erro ao processar webhook", e);
            }
        }

        res.status(200).send();
    }
}