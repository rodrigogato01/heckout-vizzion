import { Request, Response } from 'express';
import { PixService } from '../services/PixService';

const pixService = new PixService();

export class PixController {
    async create(req: Request, res: Response) {
        const { amount, name, cpf } = req.body;
        try {
            const result = await pixService.createCharge(Number(amount), name, cpf);
            res.json(result);
        } catch (error) { res.status(500).json({ error: 'Erro ao criar' }); }
    }

    async webhook(req: Request, res: Response) {
        const { data } = req.body;
        if (data && data.id) {
            const id = String(data.id);
            const status = await pixService.checkStatus(id);
            if (status === 'approved') { await pixService.refund(id); }
        }
        res.status(200).send();
    }

    // ESTA É A FUNÇÃO QUE O LOG DIZ QUE FALTA
    async checkStatus(req: Request, res: Response) {
        const { id } = req.params;
        try {
            const status = await pixService.checkStatus(id);
            res.json({ status });
        } catch (error) { res.status(500).json({ error: 'Erro' }); }
    }
}