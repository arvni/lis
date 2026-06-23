<?php

namespace App\Http\Controllers\System;

use App\Domains\User\Enums\ActivityType;
use App\Domains\User\Repositories\UserActivityRepository;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class AuditLogController extends Controller
{
    public function __construct(private UserActivityRepository $userActivities) {}

    public function __invoke(Request $request): \Inertia\Response
    {
        Gate::authorize('System.Audit Log.View Audit Log');

        $filters = $request->only(['user_id', 'activity_type', 'related_type', 'from', 'to']);

        $activities = $this->userActivities->paginateAuditLog($filters)->withQueryString();

        return Inertia::render('AuditLog/Index', [
            'activities'     => $activities,
            'activity_types' => ActivityType::cases(),
            'filters'        => $filters,
        ]);
    }
}
