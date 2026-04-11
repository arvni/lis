<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class FailedJobController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('failed-jobs.list');

        $search    = $request->input('filters.search');
        $jobType   = $request->input('filters.job_type');
        $queue     = $request->input('filters.queue');
        $sortField = $request->input('sort.field', 'failed_at');
        $sortDir   = $request->input('sort.sort', 'desc');
        $pageSize  = (int) $request->input('pageSize', 20);

        $query = DB::table('failed_jobs')->orderBy($sortField, $sortDir);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('payload', 'like', "%{$search}%")
                  ->orWhere('exception', 'like', "%{$search}%")
                  ->orWhere('uuid', 'like', "%{$search}%");
            });
        }

        if ($jobType) {
            $query->where('payload', 'like', "%{$jobType}%");
        }

        if ($queue) {
            $query->where('queue', $queue);
        }

        $rawJobs = $query->paginate($pageSize);

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

        // Counts by type for summary
        $typeSummary = DB::table('failed_jobs')
            ->selectRaw("SUBSTRING_INDEX(SUBSTRING_INDEX(payload, '\"displayName\":\"', -1), '\"', 1) as job_type, COUNT(*) as count")
            ->groupBy('job_type')
            ->orderByDesc('count')
            ->limit(20)
            ->get();

        $queues = DB::table('failed_jobs')->distinct()->pluck('queue');

        return Inertia::render('FailedJob/Index', [
            'failedJobs'  => [
                'data'          => $items,
                'total'         => $rawJobs->total(),
                'per_page'      => $rawJobs->perPage(),
                'current_page'  => $rawJobs->currentPage(),
                'last_page'     => $rawJobs->lastPage(),
            ],
            'typeSummary'   => $typeSummary,
            'queues'        => $queues,
            'requestInputs' => $request->all(),
            'canDelete' => $request->user()->can('failed-jobs.delete'),
            'canRetry'  => $request->user()->can('failed-jobs.retry'),
        ]);
    }

    public function retry(string $uuid)
    {
        $this->authorize('failed-jobs.retry');

        $job = DB::table('failed_jobs')->where('uuid', $uuid)->first();
        if (!$job) {
            return back()->with(['success' => false, 'status' => 'Job not found.']);
        }

        Artisan::call('queue:retry', ['id' => [$uuid]]);

        return back()->with(['success' => true, 'status' => "Job {$uuid} queued for retry."]);
    }

    public function destroy(string $uuid)
    {
        $this->authorize('failed-jobs.delete');

        DB::table('failed_jobs')->where('uuid', $uuid)->delete();

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
            DB::table('failed_jobs')->whereIn('uuid', $uuids)->delete();
            $message = count($uuids) . ' job(s) deleted.';
        }

        return back()->with(['success' => true, 'status' => $message]);
    }
}
