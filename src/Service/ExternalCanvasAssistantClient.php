<?php

declare(strict_types=1);

namespace Maoxtrem\AsistenteCamvasia\Service;

use Maoxtrem\AsistenteCamvasia\DTO\CanvasGenerationRequest;
use Maoxtrem\AsistenteCamvasia\DTO\CanvasGenerationResponse;
use Throwable;
use Symfony\Contracts\HttpClient\HttpClientInterface;

final class ExternalCanvasAssistantClient
{
    public function __construct(
        private readonly HttpClientInterface $httpClient,
        private readonly string $baseUrl,
        private readonly string $generationEndpoint,
        private readonly string $apiKey,
        private readonly float $connectTimeout,
        private readonly float $timeout,
        private readonly bool $verifyPeer,
        private readonly bool $verifyHost,
        private readonly array $defaultHeaders = [],
    ) {
    }

    public function generate(CanvasGenerationRequest $request): CanvasGenerationResponse
    {
        try {
            $response = $this->httpClient->request('POST', $this->buildUrl(), [
                'headers' => $this->buildHeaders(),
                'json' => $request->toArray(),
                'max_connect_duration' => $this->connectTimeout,
                'timeout' => $this->timeout,
                'verify_peer' => $this->verifyPeer,
                'verify_host' => $this->verifyHost,
            ]);

            $payload = $response->toArray(false);
        } catch (Throwable $exception) {
            return new CanvasGenerationResponse(
                ok: false,
                message: 'No fue posible conectar con el microservicio de canvas IA.',
                design: null,
                actions: [],
                raw: ['error' => $exception->getMessage()],
            );
        }

        $data = is_array($payload['data'] ?? null) ? $payload['data'] : [];
        $message = trim((string) ($data['message'] ?? $payload['message'] ?? ''));
        $design = is_array($data['design'] ?? null) ? $data['design'] : (is_array($payload['design'] ?? null) ? $payload['design'] : null);
        $actions = is_array($data['actions'] ?? null) ? $data['actions'] : (is_array($payload['actions'] ?? null) ? $payload['actions'] : []);

        return new CanvasGenerationResponse(
            ok: true,
            message: $message !== '' ? $message : 'El microservicio no devolvio una respuesta util.',
            design: $design,
            actions: $actions,
            raw: is_array($payload) ? $payload : [],
        );
    }

    private function buildUrl(): string
    {
        return rtrim($this->baseUrl, '/') . '/' . ltrim($this->generationEndpoint, '/');
    }

    /**
     * @return array<string, string>
     */
    private function buildHeaders(): array
    {
        $headers = array_merge([
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ], $this->defaultHeaders);

        if ($this->apiKey !== '') {
            $headers['Authorization'] = 'Bearer ' . $this->apiKey;
        }

        return $headers;
    }
}
