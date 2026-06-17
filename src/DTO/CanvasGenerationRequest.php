<?php

declare(strict_types=1);

namespace Maoxtrem\AsistenteCamvasia\DTO;

final class CanvasGenerationRequest
{
    /**
     * @param array<string, mixed> $canvas
     * @param array<int, array<string, mixed>> $elements
     * @param array<string, mixed> $context
     * @param array<string, mixed> $metadata
     */
    public function __construct(
        public readonly string $message,
        public readonly string $tenant,
        public readonly string $locale,
        public readonly string $mode,
        public readonly array $canvas,
        public readonly array $elements,
        public readonly array $context,
        public readonly array $metadata,
    ) {
    }

    public static function fromArray(array $payload, string $tenantFallback = 'marketing'): self
    {
        return new self(
            message: trim((string) ($payload['message'] ?? '')),
            tenant: trim((string) ($payload['tenant'] ?? $tenantFallback)),
            locale: self::normalizeLocale($payload['locale'] ?? 'es'),
            mode: trim((string) ($payload['mode'] ?? 'generate')),
            canvas: is_array($payload['canvas'] ?? null) ? $payload['canvas'] : [],
            elements: is_array($payload['elements'] ?? null) ? $payload['elements'] : [],
            context: is_array($payload['context'] ?? null) ? $payload['context'] : [],
            metadata: is_array($payload['metadata'] ?? null) ? $payload['metadata'] : [],
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'message' => $this->message,
            'tenant' => $this->tenant,
            'locale' => $this->locale,
            'mode' => $this->mode,
            'canvas' => $this->canvas,
            'elements' => $this->elements,
            'context' => $this->context,
            'metadata' => $this->metadata,
        ];
    }

    private static function normalizeLocale(mixed $value): string
    {
        $normalized = strtolower(trim((string) ($value ?? '')));

        return $normalized !== '' ? str_replace('_', '-', $normalized) : 'es';
    }
}
