<?php

declare(strict_types=1);

namespace Maoxtrem\AsistenteCamvasia\DTO;

final class CanvasGenerationRequest
{
    public function __construct(
        public readonly string $message,
        public readonly string $tenant,
        public readonly string $usuario,
        public readonly string $locale = 'es',
        public readonly array $metadata = [],
    ) {
    }

    public static function fromArray(array $payload, string $tenantFallback = 'marketing', string $usuarioFallback = ''): self
    {
        return new self(
            message: trim((string) ($payload['message'] ?? $payload['question'] ?? '')),
            tenant: self::resolveValue($payload['tenant'] ?? null, $tenantFallback),
            usuario: self::resolveValue($payload['usuario'] ?? null, $usuarioFallback),
            locale: self::resolveValue($payload['locale'] ?? $payload['lang'] ?? null, 'es'),
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
            'usuario' => $this->usuario,
            'locale' => $this->locale,
            'metadata' => $this->metadata,
        ];
    }

    private static function resolveValue(mixed $value, string $fallback): string
    {
        $normalized = trim((string) ($value ?? ''));

        return $normalized !== '' ? $normalized : $fallback;
    }
}
