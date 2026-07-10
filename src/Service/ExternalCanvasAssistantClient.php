<?php

declare(strict_types=1);

namespace Maoxtrem\AsistenteCamvasia\Service;

use Maoxtrem\AsistenteCamvasia\DTO\CanvasGenerationRequest;
use Maoxtrem\AsistenteCamvasia\DTO\CanvasGenerationResponse;
use Maoxtrem\AsistenteCamvasia\Support\LocaleCopy;
use Throwable;
use Symfony\Contracts\HttpClient\HttpClientInterface;

final class ExternalCanvasAssistantClient
{
    public function __construct(
        private readonly HttpClientInterface $httpClient,
        private readonly string $baseUrl,
        private readonly string $generationEndpoint,
        private readonly string $imagesEndpoint,
        private readonly string $healthEndpoint,
        private readonly string $apiKey,
        private readonly float $connectTimeout,
        private readonly float $timeout,
        private readonly bool $verifyPeer,
        private readonly bool $verifyHost,
        private readonly array $defaultHeaders = [],
        private readonly string $locale = 'es',
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
            $copy = LocaleCopy::service($request->locale);

            return new CanvasGenerationResponse(
                ok: false,
                message: $copy['connection_failed'],
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
            message: $message !== '' ? $message : LocaleCopy::service($request->locale)['generation_unavailable'],
            design: $design,
            actions: $actions,
            raw: is_array($payload) ? $payload : [],
        );
    }

    /**
     * @return array{ok:bool, message:string, status_code:?int, raw:array<string, mixed>}
     */
    public function health(?string $locale = null): array
    {
        $resolvedLocale = $locale !== null && trim($locale) !== '' ? $locale : $this->locale;

        try {
            $response = $this->httpClient->request('GET', $this->buildHealthUrl(), [
                'headers' => $this->buildHeaders(),
                'max_connect_duration' => $this->connectTimeout,
                'timeout' => min($this->timeout, 10.0),
                'verify_peer' => $this->verifyPeer,
                'verify_host' => $this->verifyHost,
            ]);

            $payload = $response->toArray(false);
            $statusCode = $response->getStatusCode();
            $message = trim((string) ($payload['message'] ?? $payload['status'] ?? ''));

            return [
                'ok' => $statusCode >= 200 && $statusCode < 300,
                'message' => $message !== '' ? $message : LocaleCopy::service($resolvedLocale)['connection_available'],
                'status_code' => $statusCode,
                'raw' => is_array($payload) ? $payload : [],
            ];
        } catch (Throwable $exception) {
            $copy = LocaleCopy::service($resolvedLocale);

            return [
                'ok' => false,
                'message' => $copy['connection_failed'],
                'status_code' => null,
                'raw' => ['error' => $exception->getMessage()],
            ];
        }
    }

    /**
     * @return array{ok:bool, status_code:int, message:string, payload:array<string, mixed>}
     */
    public function images(array $payload = []): array
    {
        try {
            $response = $this->httpClient->request('POST', $this->buildImagesUrl(), [
                'headers' => $this->buildHeaders(),
                'json' => $payload,
                'max_connect_duration' => $this->connectTimeout,
                'timeout' => $this->timeout,
                'verify_peer' => $this->verifyPeer,
                'verify_host' => $this->verifyHost,
            ]);

            $payload = $response->toArray(false);
            $statusCode = $response->getStatusCode();
            $message = trim((string) ($payload['message'] ?? $payload['status'] ?? ''));

            return [
                'ok' => $statusCode >= 200 && $statusCode < 300,
                'status_code' => $statusCode,
                'message' => $message,
                'payload' => is_array($payload) ? $payload : [],
            ];
        } catch (Throwable $exception) {
            return [
                'ok' => false,
                'status_code' => 502,
                'message' => LocaleCopy::service($this->locale)['connection_failed'],
                'payload' => [],
            ];
        }
    }

    private function buildUrl(): string
    {
        return $this->buildAbsoluteUrl($this->generationEndpoint);
    }

    private function buildImagesUrl(): string
    {
        return $this->buildAbsoluteUrl($this->imagesEndpoint);
    }

    private function buildHealthUrl(): string
    {
        return $this->buildAbsoluteUrl($this->healthEndpoint);
    }

    private function buildAbsoluteUrl(string $endpoint): string
    {
        if (preg_match('#^https?://#i', $endpoint) === 1) {
            return $endpoint;
        }

        return rtrim($this->baseUrl, '/') . '/' . ltrim($endpoint, '/');
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
