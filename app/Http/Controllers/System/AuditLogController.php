<?php

namespace App\Http\Controllers\System;

use App\Domains\User\Enums\ActivityType;
use App\Domains\User\Models\UserActivity;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class AuditLogController extends Controller
{
    public function __invoke(Request $request)
    {
        Gate::authorize('System.Audit Log.View Audit Log');

        $query = UserActivity::query()
            ->with('user:id,name')
            ->latest();

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }
        if ($request->filled('activity_type')) {
            $query->where('activity_type', $request->activity_type);
        }
        if ($request->filled('related_type')) {
            $query->where('related_type', 'like', '%' . $request->related_type . '%');
        }
        if ($request->filled('from')) {
            $query->whereDate('created_at', '>=', $request->from);
        }
        if ($request->filled('to')) {
            $query->whereDate('created_at', '<=', $request->to);
        }

        $activities = $query->paginate(50)->withQueryString();

        return Inertia::render('AuditLog/Index', [
            'activities'     => $activities,
            'activity_types' => ActivityType::cases(),
            'filters'        => $request->only(['user_id', 'activity_type', 'related_type', 'from', 'to']),
        ]);
    }
}
