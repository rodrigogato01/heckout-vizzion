<?php
// teste.php - Descobridor de API VizzionPay
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: text/html; charset=utf-8');

$apiKey = getenv('VIZZION_CLIENT_SECRET');

echo "<h1>🕵️ Teste de Conexão: VizzionPay</h1>";
echo "<p>Sua chave final: <strong>" . substr($apiKey, -5) . "</strong> (Correto?)</p><hr>";

// LISTA DE ENDEREÇOS PARA TESTAR
$tentativas = [
    "https://api.vizzionpay.com/v1/pix",           // Tentativa 1 (Padrão)
    "https://app.vizzionpay.com/api/v1/pix",       // Tentativa 2 (Direto no App)
    "https://api.vizzionpay.com/api/v1/pix",       // Tentativa 3 (Variação)
    "https://api.vizzionpay.com.br/v1/pix"         // Tentativa 4 (.com.br)
];

foreach ($tentativas as $url) {
    echo "<p>Testando: <strong>$url</strong> ... ";
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(["amount" => 100])); // Payload falso
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Content-Type: application/json",
        "Authorization: Bearer " . $apiKey
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5); // Espera max 5 segundos
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode == 200 || $httpCode == 201 || $httpCode == 400 || $httpCode == 422) {
        // Se der 400 ou 422, significa que CONECTOU, mas reclamou dos dados (o que é ótimo!)
        echo "<span style='color:green; font-weight:bold'>✅ FUNCIONOU! (Status $httpCode)</span></p>";
        echo "<div style='background:#dff0d8; padding:10px; border:1px solid green;'>";
        echo "🎉 <strong>ACHAMOS!</strong> O link correto para usar no seu api_pix.php é:<br>";
        echo "<h2>$url</h2>";
        echo "</div>";
        exit; // Para o script assim que achar
    } elseif ($httpCode == 401) {
        echo "<span style='color:orange'>⚠ Conectou, mas deu erro de Chave (401). O link pode ser esse, mas a chave tá sendo recusada.</span></p>";
    } else {
        echo "<span style='color:red'>❌ Falha (Status $httpCode)</span></p>";
    }
}

echo "<hr><p>Se nenhum funcionou, entre no painel da Vizzion e procure um botão escrito <strong>Documentação</strong> ou <strong>API Docs</strong>.</p>";
?>