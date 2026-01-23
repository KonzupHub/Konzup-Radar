#!/bin/bash

# ========================================
# 🚀 Konzup Radar Bot - Script de Deploy
# ========================================
#
# Este script faz o deploy completo do bot scanner
# Inclui: Cloud Functions + Cloud Scheduler + Firestore
#
# Uso: ./deploy.sh
#

set -e

PROJECT_ID="gen-lang-client-0598434360"
REGION="us-central1"

echo ""
echo "═══════════════════════════════════════════════"
echo "🚀 KONZUP RADAR BOT - DEPLOY AUTOMATIZADO"
echo "═══════════════════════════════════════════════"
echo ""

# 1. Habilitar APIs necessárias
echo "📋 Habilitando APIs do Google Cloud..."
gcloud services enable \
  cloudfunctions.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  run.googleapis.com \
  cloudscheduler.googleapis.com \
  firestore.googleapis.com \
  --project=$PROJECT_ID

echo "   ✅ APIs habilitadas"
sleep 5  # Aguarda propagação

# 2. Criar banco Firestore (se não existir)
echo ""
echo "📋 Configurando Firestore..."
gcloud firestore databases create --location=us-central --project=$PROJECT_ID 2>/dev/null || echo "   (Firestore já existe)"
echo "   ✅ Firestore configurado"

# 3. Deploy da função scanner
echo ""
echo "📋 Fazendo deploy da função scanPolymarket..."
gcloud functions deploy scanPolymarket \
  --gen2 \
  --runtime=nodejs20 \
  --region=$REGION \
  --source=. \
  --entry-point=scanPolymarket \
  --trigger-http \
  --allow-unauthenticated \
  --memory=512MB \
  --timeout=300s \
  --project=$PROJECT_ID \
  --quiet

SCANNER_URL=$(gcloud functions describe scanPolymarket --region=$REGION --project=$PROJECT_ID --format='value(serviceConfig.uri)')
echo "   ✅ Scanner: $SCANNER_URL"

# 4. Deploy da função API
echo ""
echo "📋 Fazendo deploy da função getDiscoveredEvents..."
gcloud functions deploy getDiscoveredEvents \
  --gen2 \
  --runtime=nodejs20 \
  --region=$REGION \
  --source=. \
  --entry-point=getDiscoveredEvents \
  --trigger-http \
  --allow-unauthenticated \
  --memory=256MB \
  --timeout=60s \
  --project=$PROJECT_ID \
  --quiet

API_URL=$(gcloud functions describe getDiscoveredEvents --region=$REGION --project=$PROJECT_ID --format='value(serviceConfig.uri)')
echo "   ✅ API: $API_URL"

# 5. Criar Cloud Scheduler (se não existir)
echo ""
echo "📋 Configurando Cloud Scheduler (toda segunda-feira às 6h)..."
gcloud scheduler jobs delete konzup-radar-weekly-scan --location=$REGION --project=$PROJECT_ID --quiet 2>/dev/null || true

gcloud scheduler jobs create http konzup-radar-weekly-scan \
  --location=$REGION \
  --schedule="0 6 * * 1" \
  --uri="$SCANNER_URL" \
  --http-method=POST \
  --project=$PROJECT_ID \
  --description="Varredura semanal do Konzup Radar Bot"

echo "   ✅ Scheduler configurado: toda segunda às 6h UTC"

# 6. Executa primeira varredura
echo ""
echo "📋 Executando primeira varredura..."
curl -s -X POST "$SCANNER_URL" | head -100
echo ""

# 7. Resumo final
echo ""
echo "═══════════════════════════════════════════════"
echo "✅ DEPLOY CONCLUÍDO COM SUCESSO!"
echo "═══════════════════════════════════════════════"
echo ""
echo "📌 URLs:"
echo "   Scanner: $SCANNER_URL"
echo "   API:     $API_URL"
echo ""
echo "📌 Scheduler:"
echo "   Nome: konzup-radar-weekly-scan"
echo "   Agenda: Toda segunda-feira às 6h UTC"
echo ""
echo "📌 Testar manualmente:"
echo "   curl -X POST $SCANNER_URL"
echo ""
