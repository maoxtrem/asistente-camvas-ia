<?php

declare(strict_types=1);

namespace Maoxtrem\AsistenteCamvasia\DependencyInjection;

use Symfony\Component\Config\FileLocator;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Extension\Extension;
use Symfony\Component\DependencyInjection\Loader\YamlFileLoader;

final class AsistenteCamvasiaExtension extends Extension
{
    public function load(array $configs, ContainerBuilder $container): void
    {
        $configuration = new Configuration();
        $config = $this->processConfiguration($configuration, $configs);

        $container->setParameter('asistentecamvasia.base_url', $config['base_url']);
        $container->setParameter('asistentecamvasia.generation_endpoint', $config['generation_endpoint']);
        $container->setParameter('asistentecamvasia.images_endpoint', $config['images_endpoint']);
        $container->setParameter('asistentecamvasia.health_endpoint', $config['health_endpoint']);
        $container->setParameter('asistentecamvasia.tenant_name', $config['tenant_name']);
        $container->setParameter('asistentecamvasia.canvas_environment', $config['canvas_environment']);
        $container->setParameter('asistentecamvasia.images_limit', $config['images_limit']);
        $container->setParameter('asistentecamvasia.locale', $config['locale']);
        $container->setParameter('asistentecamvasia.api_key', $config['api_key']);
        $container->setParameter('asistentecamvasia.connect_timeout', $config['connect_timeout']);
        $container->setParameter('asistentecamvasia.timeout', $config['timeout']);
        $container->setParameter('asistentecamvasia.verify_peer', $config['verify_peer']);
        $container->setParameter('asistentecamvasia.verify_host', $config['verify_host']);
        $container->setParameter('asistentecamvasia.widget_title', $config['widget_title']);
        $container->setParameter('asistentecamvasia.widget_label', $config['widget_label']);
        $container->setParameter('asistentecamvasia.widget_message', $config['widget_message']);
        $container->setParameter('asistentecamvasia.widget_help_text', $config['widget_help_text']);
        $container->setParameter('asistentecamvasia.default_headers', $config['default_headers']);

        $loader = new YamlFileLoader($container, new FileLocator(__DIR__ . '/../../config'));
        $loader->load('services.yaml');
    }

    public function getAlias(): string
    {
        return 'asistente_camvasia';
    }
}
