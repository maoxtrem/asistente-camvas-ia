<?php

declare(strict_types=1);

namespace Maoxtrem\AsistenteCamvasia\Controller\Api;

use Maoxtrem\AsistenteCamvasia\DTO\CanvasGenerationRequest;
use Maoxtrem\AsistenteCamvasia\Service\ExternalCanvasAssistantClient;
use Maoxtrem\AsistenteCamvasia\Support\LocaleCopy;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

final class CanvasGenerationController
{
    public function __construct(
        private readonly ExternalCanvasAssistantClient $canvasAssistantClient,
        private readonly string $tenantName,
        private readonly string $locale,
    ) {
    }

    #[Route('/api/v1/asistentecamvasia/canvas/generate', name: 'asistentecamvasia_canvas_generate', methods: ['POST'])]
    public function __invoke(Request $request): JsonResponse
    {
        $payload = json_decode($request->getContent(), true);

        if (!is_array($payload)) {
            return new JsonResponse([
                'ok' => false,
                'error' => [
                    'code' => 'invalid_json',
                    'message' => LocaleCopy::widget($this->locale)['invalid_json'],
                ],
            ], JsonResponse::HTTP_BAD_REQUEST);
        }

        $payload['tenant'] = trim((string) ($payload['tenant'] ?? $this->tenantName));
        $generationRequest = CanvasGenerationRequest::fromArray($payload, $this->tenantName);

        if ($generationRequest->message === '') {
            return new JsonResponse([
                'ok' => false,
                'error' => [
                    'code' => 'message_required',
                    'message' => LocaleCopy::widget($this->locale)['message_required'],
                ],
            ], JsonResponse::HTTP_UNPROCESSABLE_ENTITY);
        }

        return new JsonResponse(
            $this->canvasAssistantClient->generate($generationRequest)->toArray()
        );
    }
}
