<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('inventory:mark-expired-lots')->dailyAt('00:05');
Schedule::command('inventory:escalate-overdue-pr-steps')->dailyAt('08:00');
Schedule::command('monitoring:fetch-samples')->everyFiveMinutes();
