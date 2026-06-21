<?php

namespace App\Http\Controllers\System;

use App\Domains\System\Repositories\FailedJobRepository;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Inertia\Inertia;
use Inertia\Response;

class FailedJobController extends Controller
{
    public function __construct(private FailedJobRepository $failedJobs) {}

    public function index(Request $request): Response
    {
        $this->authorize('failed-jobs.list');

        $rawJobs = $this->failedJobs->paginate(
            $request->input('filters.search'),
            $request->input('filters.job_type'),
            $request->input('filters.queue'),
            $request->input('sort.field', 'failed_at'),
            $request->input('sort.sort', 'desc'),
            (int) $request->input('pageSize', 20),
        );

        // Decode payload to extract displayName and extract first line of exception
        $items = collect($rawJobs->items())->map(function ($job) {
            $payload = json_decode($job->payload, true);
            $exceptionLines = explode("\n", $job->exception);
            return [
                'id'           => $job->id,
                'uuid'         => $job->uuid,
                'connection'   => $job->connection,
                'queue'        => $job->queue,
                'display_name' => $payload['displayName'] ?? 'Unknown',
                'max_tries'    => $payload['maxTries'] ?? null,
                'backoff'      => $payload['backoff'] ?? null,
                'exception'    => $exceptionLines[0] ?? $job->exception,
                'full_exception' => $job->exception,
                'failed_at'    => $job->failed_at,
            ];
        });

        return Inertia::render('FailedJob/Index', [
            'failedJobs'  => [
                'data'          => $items,
                'total'         => $rawJobs->total(),
                'per_page'      => $rawJobs->perPage(),
                'current_page'  => $rawJobs->currentPage(),
                'last_page'     => $rawJobs->lastPage(),
            ],
            'typeSummary'   => $this->failedJobs->typeSummary(),
            'queues'        => $this->failedJobs->distinctQueues(),
            'requestInputs' => $request->all(),
            'canDelete' => $request->user()->can('failed-jobs.delete'),
            'canRetry'  => $request->user()->can('failed-jobs.retry'),
        ]);
    }

    public function retry(string $uuid)
    {
        $this->authorize('failed-jobs.retry');

        if (!$this->failedJobs->existsByUuid($uuid)) {
            return back()->with(['success' => false, 'status' => 'Job not found.']);
        }

        Artisan::call('queue:retry', ['id' => [$uuid]]);

        return back()->with(['success' => true, 'status' => "Job {$uuid} queued for retry."]);
    }

    public function destroy(string $uuid)
    {
        $this->authorize('failed-jobs.delete');

        $this->failedJobs->deleteByUuid($uuid);

        return back()->with(['success' => true, 'status' => 'Failed job deleted.']);
    }

    public function retryAll(Request $request)
    {
        $this->authorize('failed-jobs.retry');

        $uuids = $request->input('uuids', []);

        if (empty($uuids)) {
            Artisan::call('queue:retry', ['id' => ['all']]);
            $message = 'All failed jobs queued for retry.';
        } else {
            Artisan::call('queue:retry', ['id' => $uuids]);
            $message = count($uuids) . ' job(s) queued for retry.';
        }

        return back()->with(['success' => true, 'status' => $message]);
    }

    public function destroyAll(Request $request)
    {
        $this->authorize('failed-jobs.delete');

        $uuids = $request->input('uuids', []);

        if (empty($uuids)) {
            Artisan::call('queue:flush');
            $message = 'All failed jobs deleted.';
        } else {
            $this->failedJobs->deleteByUuids($uuids);
            $message = count($uuids) . ' job(s) deleted.';
        }

        return back()->with(['success' => true, 'status' => $message]);
    }
}
