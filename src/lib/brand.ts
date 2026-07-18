/**
 * Marca white-label: cambia APP_NAME en tu .env (o docker-compose.yml)
 * y toda la interfaz se renombra sola.
 */
export const appName = process.env.APP_NAME?.trim() || "White Label";
