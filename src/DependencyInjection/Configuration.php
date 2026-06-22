<?php

declare(strict_types=1);

namespace Maoxtrem\AsistenteCamvasia\DependencyInjection;

use Symfony\Component\Config\Definition\Builder\TreeBuilder;
use Symfony\Component\Config\Definition\ConfigurationInterface;

final class Configuration implements ConfigurationInterface
{
    public function getConfigTreeBuilder(): TreeBuilder
    {
        $treeBuilder = new TreeBuilder('asistente_camvasia');

        $treeBuilder->getRootNode()
            ->children()
                ->scalarNode('base_url')->defaultValue('http://host.docker.internal:8001')->end()
                ->scalarNode('generation_endpoint')->defaultValue('/api/v1/asistentecamvasia/canvas/generate')->end()
                ->scalarNode('health_endpoint')->defaultValue('/api/health')->end()
                ->scalarNode('tenant_name')->defaultValue('marketing')->end()
                ->scalarNode('api_key')->defaultValue('')->end()
                ->floatNode('connect_timeout')->defaultValue(5.0)->end()
                ->floatNode('timeout')->defaultValue(45.0)->end()
                ->booleanNode('verify_peer')->defaultTrue()->end()
                ->booleanNode('verify_host')->defaultTrue()->end()
                ->scalarNode('widget_title')->defaultValue('Asistente Canvas IA')->end()
                ->scalarNode('widget_label')->defaultValue('Canvas IA')->end()
                ->scalarNode('widget_message')->defaultValue('Ya hay conexión al microservicio de canvas.')->end()
                ->scalarNode('widget_help_text')->defaultValue('Listo para preparar el lienzo cuando lo necesites.')->end()
                ->arrayNode('default_headers')
                    ->useAttributeAsKey('name')
                    ->scalarPrototype()->end()
                    ->defaultValue([])
                ->end()
            ->end();

        return $treeBuilder;
    }
}
