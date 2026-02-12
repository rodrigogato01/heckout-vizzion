import { Request, Response } from 'express';
import axios from 'axios';
import https from 'https';
import fs from 'fs';
import path from 'path';

export class PixController {
    private credentials = {
        client_id: 'SEU_CLIENT_ID_AQUI',
        client_secret: 'SEU_CLIENT_SECRET_AQUI',
        certificate: 'producao-875882-Shopee Bônus.p12' 
    };

    private getHttpsAgent() {
        const certPath = path.resolve(process.cwd(), this.credentials.certificate);
        const cert = fs.readFileSync(certPath);
        return new https.Agent({ pfx: cert, passphrase: '' });
    }

    private async getAccessToken() {
        const auth = Buffer.from(`${this.credentials.client_id}:${this.credentials.client_secret}`).toString('base64');
        const response = await axios.post('https://pix.api.efipay.com.br/oauth/token', 
            { grant_type: 'client_credentials' },
            {
                headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
                httpsAgent: this.getHttpsAgent()
            }
        );
        return response.data.access_token;
    }

    create = async (req: Request, res: Response) => {
        try {
            const { name, cpf, valor } = req.body;
            const token = await this.getAccessToken();

            const cob = await axios.post('https://pix.api.efipay.com.br/v2/cob', {
                calendario: { expiracao: 3600 },
                devedor: { cpf: cpf.replace(/\D/g, ''), nome: name },
                valor: { original: parseFloat(valor).toFixed(2) },
                chave: 'SUA_CHAVE_PIX_AQUI',
                solicitacaoPagador: 'Pagamento Seguro'
            }, {
                headers: { Authorization: `Bearer ${token}` },
                httpsAgent: this.getHttpsAgent()
            });

            const qrcode = await axios.get(`https://pix.api.efipay.com.br/v2/loc/${cob.data.loc.id}/qrcode`, {
                headers: { Authorization: `Bearer ${token}` },
                httpsAgent: this.getHttpsAgent()
            });

            return res.json({
                success: true,
                payload: qrcode.data.qrcode,
                encodedImage: qrcode.data.imagemQrcode,
                txid: cob.data.txid 
            });
        } catch (error: any) {
            console.error("ERRO AO CRIAR PIX:", error.response?.data || error.message);
            return res.status(500).json({ success: false });
        }
    }

    // Método que estava faltando para resolver o erro no routes.ts e server.ts
    checkStatus = async (req: Request, res: Response) => {
        try {
            const { id } = req.params; // id seria o txid da cobrança
            const token = await this.getAccessToken();
            
            const response = await axios.get(`https://pix.api.efipay.com.br/v2/cob/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
                httpsAgent: this.getHttpsAgent()
            });

            return res.json({ status: response.data.status });
        } catch (error: any) {
            console.error("ERRO AO CONSULTAR STATUS:", error.response?.data || error.message);
            return res.status(500).json({ error: "Erro ao consultar status" });
        }
    }

    // Método que estava faltando para resolver o erro no server.ts
    webhook = async (req: Request, res: Response) => {
        // A Efí exige que o endpoint de webhook retorne HTTP 200
        console.log("[EFÍ WEBHOOK] Notificação recebida:", req.body);
        return res.status(200).send();
    }
}