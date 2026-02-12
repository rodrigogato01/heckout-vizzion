git add .
git commit -m "Update forçado"
git push
curl -X POST https://SEU_LINK_DO_DEPLOY_HOOK_AQUI
Write-Host "🔥 DEPLOY FORÇADO COM SUCESSO!" -ForegroundColor Cyan