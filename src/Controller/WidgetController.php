<?php

declare(strict_types=1);

namespace Maoxtrem\AsistenteCamvasia\Controller;

use Maoxtrem\AsistenteCamvasia\Service\ExternalCanvasAssistantClient;
use Maoxtrem\AsistenteCamvasia\Support\LocaleCopy;
use Symfony\Bundle\SecurityBundle\Security;
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
        private readonly Security $security,
        private readonly string $tenantName,
        private readonly string $canvasEnvironment,
        private readonly int $imagesLimit,
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
        $usuario = $this->resolveUsuario();

        return new Response($this->twig->render('@AsistenteCamvasia/widget/bubble.html.twig', [
            'tenantName' => $this->tenantName,
            'usuarioName' => $usuario,
            'canvasEnvironment' => $this->canvasEnvironment,
            'imagesLimit' => $this->imagesLimit,
            'locale' => $locale,
            'widgetTitle' => $widgetTitle,
            'widgetLabel' => $widgetLabel,
            'connection' => $this->canvasAssistantClient->health($locale),
            'imagesEndpoint' => $this->imagesEndpoint,
            'ui' => $ui,
        ]));
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
