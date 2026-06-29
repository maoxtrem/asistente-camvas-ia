<?php

declare(strict_types=1);

namespace Maoxtrem\AsistenteCamvasia\Controller\Api;

use Maoxtrem\AsistenteCamvasia\DTO\CanvasGenerationRequest;
use Maoxtrem\AsistenteCamvasia\Service\ExternalCanvasAssistantClient;
use Maoxtrem\AsistenteCamvasia\Support\LocaleCopy;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\Routing\Attribute\Route;

final class CanvasGenerationController
{
    public function __construct(
        private readonly ExternalCanvasAssistantClient $canvasAssistantClient,
        private readonly RequestStack $requestStack,
        private readonly string $locale,
    ) {
    }

    #[Route('/api/v1/asistentecamvasia/canvas/generate', name: 'asistentecamvasia_canvas_generate', methods: ['POST'])]
    public function __invoke(Request $request): JsonResponse
    {
        $locale = $request->getLocale() ?: $this->requestStack->getCurrentRequest()?->getLocale() ?: $this->locale;
        $payload = json_decode($request->getContent(), true);

        if (!is_array($payload)) {
            return new JsonResponse([
                'ok' => false,
                'error' => [
                    'code' => 'invalid_json',
                    'message' => LocaleCopy::widget($locale)['invalid_json'],
                ],
            ], JsonResponse::HTTP_BAD_REQUEST);
        }

        $generationRequest = CanvasGenerationRequest::fromArray($payload);

        if ($generationRequest->question === '') {
            return new JsonResponse([
                'ok' => false,
                'error' => [
                    'code' => 'question_required',
                    'message' => LocaleCopy::widget($locale)['question_required'],
                ],
            ], JsonResponse::HTTP_UNPROCESSABLE_ENTITY);
        }

        return new JsonResponse(
            $this->canvasAssistantClient->generate($generationRequest)->toArray()
        );
    }
}
