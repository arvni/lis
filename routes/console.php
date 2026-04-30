<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('inventory:mark-expired-lots')
    ->dailyAt('00:05')
    ->withoutOverlapping()
    ->onFailure(function () {
        Log::error('Scheduled command failed: inventory:mark-expired-lots');
    });

Schedule::command('inventory:escalate-overdue-pr-steps')
    ->dailyAt('08:00')
    ->withoutOverlapping()
    ->onFailure(function () {
        Log::error('Scheduled command failed: inventory:escalate-overdue-pr-steps');
    });

Schedule::command('monitoring:fetch-samples')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->onFailure(function () {
        Log::error('Scheduled command failed: monitoring:fetch-samples');
    });

Schedule::command('acceptance:check')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->onFailure(function () {
        Log::error('Scheduled command failed: acceptance:check');
    });

Schedule::command('referrerOrder:check')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->onFailure(function () {
        Log::error('Scheduled command failed: referrerOrder:check');
    });

Schedule::command('telescope:prune --hours=48')->daily();
