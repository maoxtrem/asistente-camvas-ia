<?php

declare(strict_types=1);

namespace Maoxtrem\AsistenteCamvasia\Controller\Api;

use Maoxtrem\AsistenteCamvasia\Service\ExternalCanvasAssistantClient;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

final class CanvasImagesController
{
    public function __construct(
        private readonly ExternalCanvasAssistantClient $canvasAssistantClient,
        private readonly Security $security,
        private readonly string $tenantName,
        private readonly string $canvasEnvironment,
        private readonly int $imagesLimit,
    ) {
    }

    #[Route('/api/v1/asistentecamvasia/canvas/images', name: 'asistentecamvasia_canvas_images', methods: ['GET', 'POST'])]
    public function __invoke(Request $request): JsonResponse
    {
        $payload = $request->isMethod('POST')
            ? json_decode($request->getContent(), true)
            : $request->query->all();

        if (!is_array($payload)) {
            $payload = [];
        }

        $tenant = trim((string) ($payload['tenant'] ?? '')) ?: $this->tenantName;
        $usuario = trim((string) ($payload['usuario'] ?? '')) ?: $this->resolveUsuario();
        $entorno = trim((string) ($payload['entorno'] ?? '')) ?: $this->canvasEnvironment;
        $limit = isset($payload['limit']) ? max(1, (int) $payload['limit']) : $this->imagesLimit;

        $result = $this->canvasAssistantClient->images([
            'tenant' => $tenant,
            'usuario' => $usuario,
            'entorno' => $entorno,
            'limit' => $limit,
        ]);

        if (($result['ok'] ?? false) !== true) {
            return new JsonResponse([
                'ok' => false,
                'message' => $result['message'] ?? 'No fue posible cargar las imagenes.',
            ], (int) ($result['status_code'] ?? 502));
        }

        return new JsonResponse($result['payload'] ?? [], (int) ($result['status_code'] ?? 200));
    }

    private function resolveUsuario(): string
    {
        $user = $this->security->getUser();
        if ($user === null) {
            return '';
        }

        if (method_exists($user, 'getUserIdentifier')) {
            return trim((string) $user->getUserIdentifier());
        }

        if (method_exists($user, '__toString')) {
            return trim((string) $user);
        }

        if (method_exists($user, 'getUsername')) {
            return trim((string) $user->getUsername());
        }

        if (method_exists($user, 'getEmail')) {
            return trim((string) $user->getEmail());
        }

        return '';
    }
}
