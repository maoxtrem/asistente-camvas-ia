<?php

declare(strict_types=1);

namespace Maoxtrem\AsistenteCamvasia\Controller\Api;

use Maoxtrem\AsistenteCamvasia\Service\ExternalCanvasAssistantClient;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

final class CanvasImagesController
{
    public function __construct(
        private readonly ExternalCanvasAssistantClient $canvasAssistantClient,
    ) {
    }

    #[Route('/api/v1/asistentecamvasia/canvas/images', name: 'asistentecamvasia_canvas_images', methods: ['GET'])]
    public function __invoke(Request $request): JsonResponse
    {
        $result = $this->canvasAssistantClient->images($request->query->all());

        if (($result['ok'] ?? false) !== true) {
            return new JsonResponse([
                'ok' => false,
                'message' => $result['message'] ?? 'No fue posible cargar las imagenes.',
            ], (int) ($result['status_code'] ?? 502));
        }

        return new JsonResponse($result['payload'] ?? [], (int) ($result['status_code'] ?? 200));
    }
}
