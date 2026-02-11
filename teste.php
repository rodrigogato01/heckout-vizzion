<?php
// teste.php - Caçador de Rotas Vizzion
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: text/html; charset=utf-8');

$apiKey = getenv('VIZZION_CLIENT_SECRET');
echo "<h1>🕵️ Caçando o Link da Vizzion</h1>";

// O domínio que sabemos que existe (do seu painel)
$baseUrl = "https://app.vizzionpay.com";

// Rotas comuns que vamos testar
$rotas = [
    "/api/v1/pix",
    "/api/v1/transaction/pix",
    "/api/pix",
    "/api/transactions",
    "/v1/pix",
    "/api/v1/gateway/pix"
];

$encontrou = false;

foreach ($rotas as $caminho) {
    $urlCompleta = $baseUrl . $caminho;
    echo "<p>Batendo em: <strong>$caminho</strong> ... ";
    
    $ch = curl_init($urlCompleta);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    // Payload vazio ou mínimo para provocar um erro de validação (que confirma que a API existe)
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(["amount" => 100])); 
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Content-Type: application/json",
        "Authorization: Bearer " . $apiKey,
        "Accept: application/json"
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    // Ignorar SSL temporariamente para evitar falsos negativos
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); 
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    // Se der 401 (Não autorizado), 400 (Erro de dados) ou 422 (Dados inválidos) ou 200/201 -> ACHAMOS!
    // Se der 404 -> Não existe. Se der 405 -> Método errado (mas existe).
    if ($httpCode == 400 || $httpCode == 401 || $httpCode == 422 || $httpCode == 200 || $httpCode == 201) {
        echo "<span style='color:green; font-weight:bold; font-size:1.2rem'>✅ ACHEI! (Status $httpCode)</span></p>";
        echo "<div style='background:#dff0d8; padding:15px; border:2px solid green; margin:10px 0;'>";
        echo "<h3>🎉 Link Correto Confirmado:</h3>";
        echo "<textarea style='width:100%; font-size:1.1rem; padding:10px' rows='1'>$urlCompleta</textarea>";
        echo "<p>Copie este link acima e coloque no seu arquivo <strong>api_pix.php</strong> agora!</p>";
        echo "</div>";
        $encontrou = true;
        break; 
    } else {
        echo "<span style='color:red'>❌ 404 (Não é aqui)</span></p>";
    }
}

if (!$encontrou) {
    echo "<hr><h3>😕 Não encontramos nas rotas padrões.</h3>";
    echo "<p>Por favor, faça o seguinte:</p>";
    echo "<ol>";
    echo "<li>Entre no painel da Vizzion: <a href='https://app.vizzionpay.com/panel/gateway' target='_blank'>app.vizzionpay.com</a></li>";
    echo "<li>No menu lateral, procure por <strong>Desenvolvedores</strong>, <strong>API</strong> ou um ícone de livro 📖 (Documentação).</li>";
    echo "<li>Procure por 'Base URL' ou 'Endpoint Pix'.</li>";
    echo "</ol>";
}
?>