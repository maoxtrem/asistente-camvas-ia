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
                ->scalarNode('images_endpoint')->defaultValue('/api/v1/asistentecamvasia/canvas/images')->end()
                ->scalarNode('health_endpoint')->defaultValue('/api/health')->end()
                ->scalarNode('tenant_name')->defaultValue('marketing')->end()
                ->scalarNode('canvas_environment')->defaultValue('dev')->end()
                ->integerNode('images_limit')->defaultValue(10)->min(1)->end()
                ->scalarNode('locale')->defaultValue('es')->end()
                ->scalarNode('api_key')->defaultValue('')->end()
                ->floatNode('connect_timeout')->defaultValue(10.0)->end()
                ->floatNode('timeout')->defaultValue(120.0)->end()
                ->booleanNode('verify_peer')->defaultTrue()->end()
                ->booleanNode('verify_host')->defaultTrue()->end()
                ->scalarNode('widget_title')->defaultValue('')->end()
                ->scalarNode('widget_label')->defaultValue('')->end()
                ->scalarNode('widget_message')->defaultValue('')->end()
                ->scalarNode('widget_help_text')->defaultValue('')->end()
                ->arrayNode('default_headers')
                    ->useAttributeAsKey('name')
                    ->scalarPrototype()->end()
                    ->defaultValue([])
                ->end()
            ->end();

        return $treeBuilder;
    }
}
