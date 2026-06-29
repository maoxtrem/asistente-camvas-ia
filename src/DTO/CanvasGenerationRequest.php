<?php

declare(strict_types=1);

namespace Maoxtrem\AsistenteCamvasia\DTO;

final class CanvasGenerationRequest
{
    public function __construct(
        public readonly string $question,
    ) {
    }

    public static function fromArray(array $payload): self
    {
        return new self(
            question: trim((string) ($payload['question'] ?? $payload['message'] ?? '')),
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'question' => $this->question,
        ];
    }
}
