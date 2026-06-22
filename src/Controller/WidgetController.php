<?php

declare(strict_types=1);

namespace Maoxtrem\AsistenteCamvasia\Controller;

use Maoxtrem\AsistenteCamvasia\Service\ExternalCanvasAssistantClient;
use Maoxtrem\AsistenteCamvasia\Support\LocaleCopy;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Twig\Environment;

final class WidgetController
{
    public function __construct(
        private readonly Environment $twig,
        private readonly ExternalCanvasAssistantClient $canvasAssistantClient,
        private readonly string $tenantName,
        private readonly string $locale,
        private readonly string $widgetTitle,
        private readonly string $widgetLabel,
        private readonly string $widgetMessage,
        private readonly string $widgetHelpText,
    ) {
    }

    #[Route('/asistentecamvasia/widget', name: 'asistentecamvasia_widget', methods: ['GET'])]
    public function __invoke(): Response
    {
        $ui = LocaleCopy::widget($this->locale);
        $widgetTitle = $this->widgetTitle !== '' ? $this->widgetTitle : $ui['widget_title'];
        $widgetLabel = $this->widgetLabel !== '' ? $this->widgetLabel : $ui['widget_label'];
        $widgetMessage = $this->widgetMessage !== '' ? $this->widgetMessage : $ui['widget_message'];
        $widgetHelpText = $this->widgetHelpText !== '' ? $this->widgetHelpText : $ui['widget_help_text'];

        return new Response($this->twig->render('@AsistenteCamvasia/widget/bubble.html.twig', [
            'tenantName' => $this->tenantName,
            'locale' => $this->locale,
            'widgetTitle' => $widgetTitle,
            'widgetLabel' => $widgetLabel,
            'widgetMessage' => $widgetMessage,
            'widgetHelpText' => $widgetHelpText,
            'connection' => $this->canvasAssistantClient->health(),
            'ui' => $ui,
        ]));
    }
}
