<?php
// teste.php - Arquivo de Diagnóstico
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: text/html; charset=utf-8');

echo "<h1>🔍 Diagnóstico do Sistema</h1>";

// 1. VERIFICAÇÃO DA CHAVE
$apiKey = getenv('VIZZION_CLIENT_SECRET');

if ($apiKey) {
    // Mostra apenas os 5 primeiros caracteres por segurança
    echo "<p style='color:green'>✅ <strong>Chave encontrada no Render:</strong> " . substr($apiKey, 0, 5) . "****************</p>";
} else {
    echo "<p style='color:red'>❌ <strong>ERRO CRÍTICO:</strong> O Render NÃO encontrou a variável 'VIZZION_CLIENT_SECRET'. Verifique a aba Environment.</p>";
    exit;
}

// 2. TESTE DE CONEXÃO COM A VIZZION
$url = "https://api.vizzionpagamentos.com.br/v1/transaction/pix";

echo "<hr><p>🔄 Tentando conectar com a Vizzion...</p>";

// Dados falsos apenas para testar a conexão
$payload = [
    "amount" => 10.00,
    "description" => "Teste de Diagnóstico",
    "customer" => [
        "name" => "Teste Admin",
        "email" => "teste@email.com",
        "document" => "00000000000" // CPF Inválido propositalmente para ver a resposta da API
    ]
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json",
    "Authorization: Bearer " . $apiKey
]);

// Ignora verificação SSL temporariamente para descartar erro de certificado
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

echo "<strong>Status HTTP:</strong> " . $httpCode . "<br>";

if ($curlError) {
    echo "<p style='color:red'>❌ <strong>Erro no cURL:</strong> $curlError</p>";
} else {
    echo "<p><strong>Resposta da API:</strong></p>";
    echo "<pre style='background:#f4f4f4; padding:10px; border:1px solid #ccc;'>" . htmlspecialchars($response) . "</pre>";
}

if ($httpCode == 401) {
    echo "<p style='color:red; font-weight:bold'>❌ ERRO 401: A chave existe, mas a Vizzion recusou. Verifique se copiou a chave certa ou se a conta está ativa.</p>";
} elseif ($httpCode == 404) {
    echo "<p style='color:red; font-weight:bold'>❌ ERRO 404: O Link da API (URL) está errado.</p>";
} elseif ($httpCode == 200 || $httpCode == 201 || $httpCode == 400) {
    echo "<p style='color:green; font-weight:bold'>✅ SUCESSO DE CONEXÃO! O servidor falou com a Vizzion. O problema era apenas nos dados enviados.</p>";
}
?>