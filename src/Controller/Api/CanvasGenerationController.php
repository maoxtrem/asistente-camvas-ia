<?php

declare(strict_types=1);

namespace Maoxtrem\AsistenteCamvasia\Controller\Api;

use Maoxtrem\AsistenteCamvasia\DTO\CanvasGenerationRequest;
use Maoxtrem\AsistenteCamvasia\Service\ExternalCanvasAssistantClient;
use Maoxtrem\AsistenteCamvasia\Support\LocaleCopy;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\Routing\Attribute\Route;

final class CanvasGenerationController
{
    public function __construct(
        private readonly ExternalCanvasAssistantClient $canvasAssistantClient,
        private readonly RequestStack $requestStack,
        private readonly Security $security,
        private readonly string $locale,
        private readonly string $tenantName,
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

        $usuario = $this->resolveUsuario();
        $payload['metadata'] = array_merge([
            'source' => 'bundle-canvas',
            'request_id' => uniqid('bundle-', true),
        ], is_array($payload['metadata'] ?? null) ? $payload['metadata'] : []);

        $generationRequest = CanvasGenerationRequest::fromArray($payload, $this->tenantName, $usuario);

        if ($generationRequest->message === '') {
            return new JsonResponse([
                'ok' => false,
                'error' => [
                    'code' => 'question_required',
                    'message' => LocaleCopy::widget($locale)['question_required'],
                ],
            ], JsonResponse::HTTP_UNPROCESSABLE_ENTITY);
        }

        if ($generationRequest->tenant === '') {
            return new JsonResponse([
                'ok' => false,
                'error' => [
                    'code' => 'tenant_required',
                    'message' => 'El tenant no esta configurado.',
                ],
            ], JsonResponse::HTTP_UNPROCESSABLE_ENTITY);
        }

        if ($generationRequest->usuario === '') {
            return new JsonResponse([
                'ok' => false,
                'error' => [
                    'code' => 'usuario_required',
                    'message' => 'No fue posible resolver el usuario autenticado.',
                ],
            ], JsonResponse::HTTP_UNPROCESSABLE_ENTITY);
        }

        return new JsonResponse(
            $this->canvasAssistantClient->generate($generationRequest)->toArray()
        );
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
