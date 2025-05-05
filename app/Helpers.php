<?php
if (!function_exists('relative_route')) {
    function relative_route(string $name, array $parameters = []): string
    {
        return parse_url(route($name, $parameters), PHP_URL_PATH);
    }
}
