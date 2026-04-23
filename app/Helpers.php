<?php
if (!function_exists('relative_route')) {
    function relative_route(string $name, array $parameters = []): string
    {
        return parse_url(route($name, $parameters), PHP_URL_PATH);
    }
}
if (!function_exists('enumMap')) {
    function enumMap(array $cases): array
    {
        return array_map(fn($c) => ['value' => $c->value, 'name' => $c->label()], $cases);
    }
}
