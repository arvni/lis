<?php

namespace App\Http\Middleware;

use App\Domains\Laboratory\Services\SectionGroupService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    public function __construct(
        private readonly SectionGroupService $sectionGroupService,
    )
    {
    }

    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = auth()->user();

        $data = parent::share($request);

        if ($user) {
            $data = [
                ...$data,
                'auth' => [
                    'user' => [
                        "id" => $user->id,
                        "name" => $user->name,
                        "email" => $user->email,
                        "username" => $user->username
                    ],
                    'permissions' => $user->getAllPermissions()->pluck('name')->toArray(),
                ],
                'sectionRoutes'        => Cache::rememberForever("user-$user->id-section-routes", fn() => $this->sectionGroupService->getTransformedSectionGroups()),
                'reorderAlertCount'    => $user->can('Inventory.ReorderAlerts.View Reorder Alerts')
                    ? \App\Domains\Inventory\Models\ReorderAlert::where('status', 'OPEN')->count()
                    : 0,
            ];
        }

        $data['success']       = $request->session()->get('success');
        $data['status']        = $request->session()->get('status');
        $data['import_errors'] = $request->session()->get('import_errors', []);
        $data['appTimezone']   = config('app.timezone');

        return $data;
    }
}
