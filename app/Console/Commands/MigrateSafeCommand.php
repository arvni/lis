<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MigrateSafeCommand extends Command
{
    protected $signature   = 'migrate:safe';
    protected $description = 'Run migrations protected by a MySQL advisory lock (safe for multiple simultaneous replicas)';

    public function handle(): int
    {
        $lock    = 'laravel_migrate';
        $timeout = 300; // seconds to wait for lock

        $this->info("⏳ Acquiring migration advisory lock '{$lock}' (timeout: {$timeout}s)...");

        // GET_LOCK is a session-scoped advisory lock: if the holding container crashes,
        // MySQL releases it automatically when the connection drops, so a second
        // container can always acquire the lock and run migrations safely.
        $acquired = DB::selectOne("SELECT GET_LOCK(?, ?) AS acquired", [$lock, $timeout])->acquired;

        if (! $acquired) {
            $this->error("❌ Could not acquire migration lock after {$timeout}s. Another replica may be stuck.");
            return self::FAILURE;
        }

        $this->info('🔒 Lock acquired. Running migrations...');

        try {
            $this->call('migrate', ['--force' => true]);
        } finally {
            DB::selectOne("SELECT RELEASE_LOCK(?)", [$lock]);
            $this->info('🔓 Migration lock released.');
        }

        return self::SUCCESS;
    }
}
