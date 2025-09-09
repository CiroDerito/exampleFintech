# Daily Updates Module

## Descripción
El módulo Daily Updates centraliza la actualización automática de datos de todos los módulos de fuentes externas (Meta Ads, Tienda Nube, Google Analytics, BCRA) usando los tokens de acceso previamente guardados por los usuarios.

## Problema Resuelto
Los usuarios vinculan sus cuentas una vez (dando permisos), pero necesitan que sus datos se actualicen diariamente sin volver a dar permisos. Este módulo utiliza los tokens guardados para hacer actualizaciones automáticas.

## Flujo de Funcionamiento

### 1. Vinculación Inicial (Manual)
```
Usuario → Da permisos → Token guardado en BD → Datos iniciales obtenidos
```

### 2. Actualización Diaria (Automática)
```
GitHub Actions (5:00 AM) → API call → Token desde BD → Datos actualizados → BD/GCS
```

## Arquitectura

### Endpoints Disponibles

#### Actualización Completa
```http
POST /daily-updates/run-all
```
- Actualiza todos los módulos para todos los usuarios activos
- Se ejecuta automáticamente vía GitHub Actions a las 5:00 AM UTC

#### Actualización por Módulo
```http
POST /daily-updates/module/{module}
```
Módulos disponibles:
- `metaAds`
- `tiendaNube` 
- `googleAnalytics`
- `bcra`

### Estructura de Respuesta

#### Actualización Completa
```json
{
  "total": 150,
  "updated": {
    "metaAds": 45,
    "tiendaNube": 30,
    "googleAnalytics": 40,
    "bcra": 35
  },
  "errors": {
    "metaAds": 2,
    "tiendaNube": 1,
    "googleAnalytics": 0,
    "bcra": 3
  }
}
```

#### Actualización por Módulo
```json
{
  "updated": 45,
  "errors": 2
}
```

## Integración por Módulo

### Meta Ads
- **Token Requerido:** `access_token` (long-lived, ~60 días)
- **Datos Actualizados:** Campaign insights, métricas de rendimiento
- **Método:** `MetaAdsService.fetchInsightsForUserAndSave()`
- **Condición:** Usuario tiene `metaAds.data.access_token` y `accountId`

### Tienda Nube
- **Token Requerido:** `access_token` (bearer token)
- **Datos Actualizados:** Órdenes, productos, métricas de ventas
- **Método:** `TiendaNubeService.fetchAndSaveRawData()`
- **Condición:** Usuario tiene `tiendaNube.data.access_token` y `storeId`

### Google Analytics
- **Token Requerido:** `access_token` + `refresh_token`
- **Datos Actualizados:** Sesiones, transacciones, revenue (últimos 30 días)
- **Método:** `GaAnalyticsService.fetchAndSaveMetrics()`
- **Condición:** Usuario tiene `gaAnalytics.data.tokens.access_token` y `propertyId`

### BCRA
- **Token Requerido:** No requiere token (API pública)
- **Datos Actualizados:** Estado en Central de Deudores
- **Método:** `BcraService.consultarDeudores()`
- **Condición:** Usuario tiene DNI configurado y registro BCRA vinculado

## Configuración de GitHub Actions

### Archivo: `.github/workflows/daily-data-updates.yml`

```yaml
name: Daily Data Updates - All Modules

on:
  schedule:
    # Ejecutar todos los días a las 5:00 AM UTC
    - cron: '0 5 * * *'
  workflow_dispatch: # Permitir ejecución manual
```

### Variables de Entorno Requeridas
```env
API_BASE_URL=https://your-api.com
API_TOKEN=your_bearer_token_for_authentication
```

### Secrets de GitHub
- `API_BASE_URL`: URL base de tu API
- `API_TOKEN`: Token de autenticación para la API

## Manejo de Errores

### Estrategias de Recuperación
1. **Error en actualización completa:** Intenta actualizar módulos individuales
2. **Error por módulo:** Continúa con el siguiente usuario
3. **Rate limiting:** Pausa de 1 segundo entre usuarios, 500ms entre módulos

### Logging
```typescript
✅ Meta Ads actualizado para usuario@email.com
❌ Error actualizando Google Analytics para usuario@email.com: Token expired
🔄 Actualizando módulo específico: metaAds
📊 Actualización diaria completada
```

## Token Management

### Refresh de Tokens
- **Google Analytics:** Auto-refresh usando `refresh_token`
- **Meta Ads:** Long-lived tokens (~60 días), requiere re-autorización manual si expiran
- **Tienda Nube:** Bearer tokens persistentes
- **BCRA:** No requiere tokens

### Detección de Tokens Expirados
```typescript
// El sistema detecta automáticamente tokens expirados y los marca como error
// Los logs muestran qué tokens necesitan renovación manual
```

## Monitoreo y Alertas

### Métricas Importantes
- Número de usuarios actualizados por módulo
- Tasa de errores por módulo
- Tiempo promedio de actualización
- Tokens que requieren renovación

### Notificaciones (Configurables)
```bash
# En caso de fallo
echo "🚨 Daily data updates encountered errors"
# Aquí se puede agregar integración con Slack, Discord, etc.
```

## Uso Manual

### Ejecutar Actualización Completa
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  "https://your-api.com/daily-updates/run-all"
```

### Ejecutar Módulo Específico
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  "https://your-api.com/daily-updates/module/metaAds"
```

## Desarrollo y Testing

### Ejecutar en Desarrollo
```bash
# Actualización completa
npm run start:dev
# Llamar endpoint manualmente para testing
```

### Logs de Desarrollo
```typescript
🚀 Iniciando actualización diaria de datos de usuarios
📊 Actualizando datos para usuario: test@email.com
✅ Meta Ads actualizado para test@email.com
🎉 Actualización diaria completada
```

## Consideraciones de Performance

### Optimizaciones
- Pausa entre usuarios (1s) para evitar saturar APIs externas
- Pausa entre módulos (500ms) para distribuir carga
- Procesamiento secuencial para control de rate limiting
- Logs detallados para debugging

### Escalabilidad
- Diseño modular permite agregar nuevas fuentes de datos fácilmente
- Cada módulo es independiente, fallas en uno no afectan otros
- Sistema de retry configurable por módulo

## Roadmap

### Mejoras Futuras
1. **Paralelización:** Procesar usuarios en paralelo con límite de concurrencia
2. **Retry Logic:** Reintentos automáticos con backoff exponencial
3. **Health Checks:** Monitoreo de salud de APIs externas
4. **Dashboard:** Vista en tiempo real del estado de actualizaciones
5. **Alertas Avanzadas:** Integración con Slack/Discord/Email

### Nuevas Integraciones
- Mercado Libre
- Google Ads
- Shopify
- Stripe/PayPal
