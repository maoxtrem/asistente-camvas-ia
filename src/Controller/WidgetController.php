<?php

declare(strict_types=1);

namespace Maoxtrem\AsistenteCamvasia\Controller;

use Maoxtrem\AsistenteCamvasia\Service\ExternalCanvasAssistantClient;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Twig\Environment;

final class WidgetController
{
    public function __construct(
        private readonly Environment $twig,
        private readonly ExternalCanvasAssistantClient $canvasAssistantClient,
        private readonly string $tenantName,
        private readonly string $widgetTitle,
        private readonly string $widgetLabel,
        private readonly string $widgetMessage,
        private readonly string $widgetHelpText,
    ) {
    }

    #[Route('/asistentecamvasia/widget', name: 'asistentecamvasia_widget', methods: ['GET'])]
    public function __invoke(): Response
    {
        return new Response($this->twig->render('@AsistenteCamvasia/widget/bubble.html.twig', [
            'tenantName' => $this->tenantName,
            'widgetTitle' => $this->widgetTitle,
            'widgetLabel' => $this->widgetLabel,
            'widgetMessage' => $this->widgetMessage,
            'widgetHelpText' => $this->widgetHelpText,
            'connection' => $this->canvasAssistantClient->health(),
        ]));
    }
}
