<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // nginx terminates HTTPS and forwards over the Docker network, so trust its X-Forwarded-*
        // headers (and only from private Docker/LAN addresses); otherwise Laravel would build http://
        // links on https:// pages. The app port itself is only reached through nginx.
        $middleware->trustProxies(at: ['172.16.0.0/12', '10.0.0.0/8', '192.168.0.0/16', '127.0.0.1']);

        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            "indexProvider" => \App\Http\Middleware\IndexProvider::class,
            "permission" => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            "role" => \Spatie\Permission\Middleware\RoleMiddleware::class,
            "role_or_permission" => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
        ]);
        //
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })
    ->create();
