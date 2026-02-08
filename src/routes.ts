import { Router } from 'express';
import { PixController } from './controllers/PixController'; // Verifique se o caminho está certo

const router = Router();
const pixController = new PixController();

router.post('/api/pagar', (req, res) => pixController.create(req, res));
router.get('/api/status/:id', (req, res) => pixController.checkStatus(req, res));
router.post('/api/webhook', (req, res) => res.status(200).send());

export { router }; // O nome aqui TEM que ser 'router'