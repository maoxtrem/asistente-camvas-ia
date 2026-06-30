<?php

declare(strict_types=1);

namespace Maoxtrem\AsistenteCamvasia\Controller;

use Maoxtrem\AsistenteCamvasia\Service\ExternalCanvasAssistantClient;
use Maoxtrem\AsistenteCamvasia\Support\LocaleCopy;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\Routing\Attribute\Route;
use Twig\Environment;

final class WidgetController
{
    public function __construct(
        private readonly Environment $twig,
        private readonly ExternalCanvasAssistantClient $canvasAssistantClient,
        private readonly RequestStack $requestStack,
        private readonly string $tenantName,
        private readonly string $locale,
        private readonly string $widgetTitle,
        private readonly string $widgetLabel,
        private readonly string $imagesEndpoint,
    ) {
    }

    #[Route('/asistentecamvasia/widget', name: 'asistentecamvasia_widget', methods: ['GET'])]
    public function __invoke(): Response
    {
        $locale = $this->requestStack->getCurrentRequest()?->getLocale() ?: $this->locale;
        $ui = LocaleCopy::widget($locale);
        $widgetTitle = $this->widgetTitle !== '' ? $this->widgetTitle : $ui['widget_title'];
        $widgetLabel = $this->widgetLabel !== '' ? $this->widgetLabel : $ui['widget_label'];

        return new Response($this->twig->render('@AsistenteCamvasia/widget/bubble.html.twig', [
            'tenantName' => $this->tenantName,
            'locale' => $locale,
            'widgetTitle' => $widgetTitle,
            'widgetLabel' => $widgetLabel,
            'connection' => $this->canvasAssistantClient->health($locale),
            'imagesEndpoint' => $this->imagesEndpoint,
            'ui' => $ui,
        ]));
    }
}
