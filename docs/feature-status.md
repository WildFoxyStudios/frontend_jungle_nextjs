# Feature Status Audit (Frontend)

## Web app

### Closed in this pass
- GIF picker: quitada API key hardcodeada; requiere `NEXT_PUBLIC_TENOR_API_KEY`.
- Wallet withdraw: eliminado `account_details` fijo; ahora requiere email real.
- Wallet quick action: botón withdraw enlazado al tab correcto.
- Wallet overview: eliminado uso de métricas dummy (`$0.00`) en favor de datos reales disponibles.

### Follow-up recomendado
- Completar internacionalización de copy todavía hardcodeada en múltiples pantallas.
- Revisar páginas estáticas con fallback de contenido no configurado.

## Admin app

### Closed in this pass
- i18n runtime integrado (next-intl + catálogos compartidos).
- namespace `admin.*` presente en todos los locales.

### Follow-up recomendado
- Continuar extracción de strings hardcodeadas restantes a `admin.*`.

