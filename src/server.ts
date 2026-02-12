const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(express.json());
app.use(cors());

// SUA CHAVE DE PRODUÇÃO ASAAS (JÁ CONFIGURADA)
const ASAAS_API_KEY = "$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjI0MDQ3YWIwLTMyMWQtNGI3Ni1iNDg3LWYzMWViNWI0N2JlMTo6JGFhY2hfMTU4YTE3MDctNTFkNy00ZmQ0LWI5MWQtZTFmZGY5YjMwNzVl";

app.post('/pix', async (req, res) => {
    try {
        console.log("Recebendo pedido:", req.body);
        const { name, cpf, email } = req.body;

        // 1. CRIAR O CLIENTE NO ASAAS
        // O Asaas exige criar o cliente antes de cobrar
        const customerResponse = await axios.post('https://www.asaas.com/api/v3/customers', {
            name: name,
            cpfCnpj: cpf,
            email: "cliente@email.com", // Email genérico para não travar
            notificationDisabled: true
        }, {
            headers: { 'access_token': ASAAS_API_KEY }
        });

        const customerId = customerResponse.data.id;

        // 2. CRIAR A COBRANÇA PIX (R$ 37,90)
        const paymentResponse = await axios.post('https://www.asaas.com/api/v3/payments', {
            customer: customerId,
            billingType: "PIX",
            value: 37.90,
            dueDate: new Date().toISOString().split('T')[0], // Vence hoje
            description: "Taxa de Verificação",
            postalService: false
        }, {
            headers: { 'access_token': ASAAS_API_KEY }
        });

        // 3. RETORNO ADAPTADO (MÁGICA)
        // Aqui eu faço o Asaas responder no formato que seu botão já espera
        // Assim você não precisa mexer no site!
        res.json({
            point_of_interaction: {
                transaction_data: {
                    // O Asaas chama de 'bankSlipUrl' ou 'invoiceUrl' a página bonita
                    ticket_url: paymentResponse.data.bankSlipUrl 
                }
            }
        });

    } catch (error) {
        console.error("Erro Asaas:", error.response ? error.response.data : error.message);
        res.status(500).json({ 
            message: "Erro ao processar pagamento no Asaas." 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));