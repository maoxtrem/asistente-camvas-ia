<?php

declare(strict_types=1);

namespace Maoxtrem\AsistenteCamvasia\Support;

final class LocaleCopy
{
    /**
     * @return array<string, string>
     */
    public static function widget(string $locale): array
    {
        $locale = self::normalizeLocale($locale);
        $isEnglish = str_starts_with($locale, 'en');

        return $isEnglish ? [
            'widget_title' => 'Canvas AI Assistant',
            'widget_label' => 'Canvas AI',
            'widget_message' => 'Connection is ready with the canvas microservice.',
            'widget_help_text' => 'Ready to prepare the canvas when you need it.',
            'close_label' => 'Close',
            'status_connected' => 'Connected',
            'status_offline' => 'Offline',
            'composer_label' => 'Write a message',
            'placeholder' => 'Write your message and send it to the canvas',
            'send_label' => 'Send',
            'sending_label' => 'Sending…',
            'user_label' => 'You',
            'assistant_label' => 'Canvas AI',
            'welcome' => 'Canvas assistant ready.',
            'help' => 'Ready to prepare the canvas when you need it.',
            'disconnected' => 'There is no connection to the microservice.',
            'no_endpoint' => 'The generation endpoint was not found.',
            'response_received' => 'Response received.',
            'design_applied' => 'Design applied to the canvas.',
            'typing' => 'Writing…',
            'default_message' => 'Connection test from the Canvas AI bubble.',
            'invalid_json' => 'The body must be valid JSON.',
            'message_required' => 'The message field is required.',
        ] : [
            'widget_title' => 'Asistente Canvas IA',
            'widget_label' => 'Canvas IA',
            'widget_message' => 'Ya hay conexión al microservicio de canvas.',
            'widget_help_text' => 'Listo para preparar el lienzo cuando lo necesites.',
            'close_label' => 'Cerrar',
            'status_connected' => 'Conectado',
            'status_offline' => 'Sin conexión',
            'composer_label' => 'Escribe un mensaje',
            'placeholder' => 'Escribe tu mensaje y envíalo al canvas',
            'send_label' => 'Enviar',
            'sending_label' => 'Enviando…',
            'user_label' => 'Tú',
            'assistant_label' => 'Canvas IA',
            'welcome' => 'Asistente de canvas listo.',
            'help' => 'Listo para preparar el lienzo cuando lo necesites.',
            'disconnected' => 'No hay conexión con el microservicio.',
            'no_endpoint' => 'No se encontró el endpoint de generación.',
            'response_received' => 'Respuesta recibida.',
            'design_applied' => 'Diseño aplicado al lienzo.',
            'typing' => 'Escribiendo…',
            'default_message' => 'Prueba de conexión desde la burbuja de Canvas IA.',
            'invalid_json' => 'El cuerpo debe ser JSON valido.',
            'message_required' => 'El campo message es obligatorio.',
        ];
    }

    /**
     * @return array{connection_failed:string,generation_unavailable:string}
     */
    public static function service(string $locale): array
    {
        $locale = self::normalizeLocale($locale);
        $isEnglish = str_starts_with($locale, 'en');

        return $isEnglish ? [
            'connection_failed' => 'Could not connect to the Canvas AI microservice.',
            'generation_unavailable' => 'The microservice did not return a useful response.',
        ] : [
            'connection_failed' => 'No fue posible conectar con el microservicio de canvas IA.',
            'generation_unavailable' => 'El microservicio no devolvio una respuesta util.',
        ];
    }

    private static function normalizeLocale(string $locale): string
    {
        $normalized = strtolower(trim($locale));

        return $normalized !== '' ? str_replace('_', '-', $normalized) : 'es';
    }
}
