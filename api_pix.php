<?php
header('Content-Type: application/json');

// AQUI ESTÁ O SEGREDO: Ele vai buscar a chave que você salvou no site do Render
$apiKey = getenv('VIZZION_CLIENT_SECRET'); 
$url = "https://api.vizzionpagamentos.com.br/v1/transaction/pix";

// Se por acaso a chave não vier do Render, dá erro
if (!$apiKey) {
    echo json_encode(['error' => 'Chave de API não configurada no Render']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

// Verifica se os dados chegaram
if (!$input) {
    echo json_encode(['error' => 'Nenhum dado recebido']);
    exit;
}

$payload = [
    "amount" => 147.90,
    "description" => "Acesso Curso - Final",
    "customer" => [
        "name" => $input['nome'],
        "email" => $input['email'],
        "document" => $input['cpf']
    ],
    // ATENÇÃO: Confirme se este link aponta para o seu projeto no Render
    "postback_url" => "https://checkoutfinal.onrender.com/webhook.php" 
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json",
    "Authorization: Bearer " . $apiKey
]);

$response = curl_exec($ch);
curl_close($ch);

echo $response;
?>