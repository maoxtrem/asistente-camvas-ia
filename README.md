# AsistenteCamvasia Bundle

Bundle Symfony para mostrar una burbuja de asistente de canvas y conectar con un microservicio externo de IA.

## Que hace

- Expone una burbuja simple para el frontend.
- Consulta el estado del microservicio para mostrar si hay conexion.
- Deja listo el endpoint de generacion de canvas para fases posteriores.

## Endpoint de widget

- `GET /asistentecamvasia/widget`

## Endpoint de generacion

- `POST /api/v1/asistentecamvasia/canvas/generate`

## Configuracion sugerida

```yaml
asistentecamvasia:
  base_url: 'http://host.docker.internal:8001'
  generation_endpoint: '/api/v1/asistentecamvasia/canvas/generate'
  health_endpoint: '/api/health'
  tenant_name: 'marketing'
  api_key: '%env(ASISTENTECAMVASIA_API_KEY)%'
  widget_title: 'Asistente Canvas IA'
  widget_label: 'Canvas IA'
  widget_message: 'Ya hay conexión al microservicio de canvas.'
  widget_help_text: 'Listo para preparar el lienzo cuando lo necesites.'
```
