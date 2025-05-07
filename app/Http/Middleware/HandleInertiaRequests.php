<?php

namespace App\Http\Middleware;

use App\Domains\Laboratory\Services\SectionGroupService;
use App\Domains\Laboratory\Services\SectionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    public function __construct(private readonly SectionGroupService $sectionGroupService,)
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
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
                'permissions' => $user?$user->getAllPermissions()->pluck('name')->toArray():[],
            ],
            'sectionRoutes' => $user ? Cache::rememberForever("user-$user->id-section-routes", fn() => $this->sectionGroupService->getTransformedSectionGroups()) : [],
        ];
    }
}
