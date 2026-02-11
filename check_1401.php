<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$a = App\Domains\Reception\Models\Acceptance::find(1401);
$repo = app(App\Domains\Reception\Repositories\AcceptanceRepository::class);

echo "status: " . $a->status->value . PHP_EOL;
echo "waiting_for_pooling: " . ($a->waiting_for_pooling ? 'true' : 'false') . PHP_EOL;
echo "reportable: " . $repo->countReportableTests($a) . PHP_EOL;
echo "published: " . $repo->countPublishedTests($a) . PHP_EOL;
echo "started: " . $repo->countStartedAcceptanceItems($a) . PHP_EOL;
