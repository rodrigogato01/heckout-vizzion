<?php
header('Content-Type: application/json');

// 1. SUA CHAVE VIZZION
$apiKey = "e08f7qe1x8zjbnx4dkra9p8v7uj1wfacwidsnnf4lhpfq3v8oz628smahn8g6kus";
$url = "https://api.vizzionpagamentos.com.br/v1/transaction/pix"; // Verifique se o endpoint mudou no manual

// 2. PEGA DADOS DO FORMULÁRIO
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    echo json_encode(['error' => 'No data']);
    exit;
}

// 3. PREPARA O PACOTE PARA A VIZZION
$payload = [
    "amount" => 147.90,
    "description" => "Acesso ao Curso Exclusivo",
    "customer" => [
        "name" => $input['nome'],
        "email" => $input['email'],
        "document" => $input['cpf']
    ],
    "postback_url" => "https://seusite.com/webhook.php" // Mude para o seu domínio real
];

// 4. CHAMADA API VIA CURL
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