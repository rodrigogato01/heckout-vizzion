import { Request, Response } from 'express';
import { PixService } from '../services/PixService';

export class PixController {
    private pixService: PixService;

    constructor() {
        this.pixService = new PixService();
    }

    async create(req: Request, res: Response) {
        const { amount, name, cpf } = req.body;

        try {
            const result = await this.pixService.createCharge(amount, name, cpf) as any;
            
            console.log(`✅ PIX Criado! ID: ${result.id}`);
            
            res.status(201).json({
                id: result.id,
                qr_code: result.point_of_interaction?.transaction_data?.qr_code,
                status: result.status
            });

            if (result.id) {
                this.monitorarPagamento(result.id);
            }

        } catch (error: any) {
            console.error("❌ Erro ao criar PIX:", error.message);
            return res.status(400).json({ error: "Erro interno no checkout" });
        }
    }

    async checkStatus(req: Request, res: Response) {
        // CORREÇÃO: Forçamos o 'id' a ser tratado como string única
        const id = req.params.id as string; 
        
        try {
            const status = await this.pixService.checkStatus(id);
            return res.json({ status });
        } catch (error) {
            return res.status(404).json({ error: "Não encontrado" });
        }
    }

    private async monitorarPagamento(id: string | number) {
        console.log(`👀 Monitorando ID ${id}...`);
        
        const intervalo = setInterval(async () => {
            const status = await this.pixService.checkStatus(id);

            if (status === 'approved') {
                console.log(`💰 APROVADO! Devolvendo R$ para ${id}...`);
                clearInterval(intervalo); 
                
                setTimeout(async () => {
                    try {
                        await this.pixService.refund(id);
                    } catch (e) {
                        console.error("❌ Falha no estorno automático");
                    }
                }, 3000);
            }
        }, 3000);

        setTimeout(() => clearInterval(intervalo), 600000);
    }
}