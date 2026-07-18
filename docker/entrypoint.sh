#!/bin/sh
set -e

echo "⏳ Sincronizando esquema de base de datos..."
ATTEMPTS=0
until npx prisma db push --skip-generate; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ "$ATTEMPTS" -ge 10 ]; then
    echo "❌ No se pudo conectar a la base de datos después de $ATTEMPTS intentos."
    exit 1
  fi
  echo "   Base de datos no disponible todavía, reintentando en 3s... ($ATTEMPTS/10)"
  sleep 3
done

echo "🌱 Ejecutando seed (usuario administrador)..."
node prisma/seed.js

echo "🚀 Iniciando la aplicación en el puerto ${PORT:-3000}..."
exec node_modules/.bin/next start -p "${PORT:-3000}"
