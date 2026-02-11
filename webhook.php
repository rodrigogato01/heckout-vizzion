<?php
// Recebe a notificação da Vizzion
$data = json_decode(file_get_contents('php://input'), true);

// Registra no log para você conferir
file_put_contents('log_pagamentos.txt', print_r($data, true), FILE_APPEND);

// Se o status for pago, a Vizzion já cuida do envio do curso se estiver configurado no painel.
if (isset($data['status']) && ($data['status'] == 'paid' || $data['status'] == 'completed')) {
    // Aqui você pode adicionar funções extras, como enviar um Zap automático.
    http_response_code(200);
}
?>  