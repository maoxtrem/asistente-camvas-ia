# AsistenteCamvasia Bundle

Bundle Symfony para orquestar generacion de contenido de canvas con un microservicio externo de IA.

## Que hace

- Recibe una solicitud de generacion o autopoblado.
- Normaliza contexto, canvas y elementos actuales.
- Llama al microservicio de IA ya existente.
- Devuelve una respuesta estructurada para que el host aplique cambios.

## Endpoint local

- `POST /api/v1/asistentecamvasia/canvas/generate`

## Configuracion sugerida

```yaml
asistentecamvasia:
  base_url: 'http://host.docker.internal:8001'
  generation_endpoint: '/api/v1/canvas/generate'
  tenant_name: 'marketing'
  api_key: '%env(ASISTENTECAMVASIA_API_KEY)%'
```
