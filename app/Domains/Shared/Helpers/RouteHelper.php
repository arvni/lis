<?php

namespace App\Domains\Shared\Helpers;

class RouteHelper
{
    public static function relativePath(string $name, array $parameters = []): string
    {
        return parse_url(route($name, $parameters), PHP_URL_PATH);
    }
}
