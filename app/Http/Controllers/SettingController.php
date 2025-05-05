<?php

namespace App\Http\Controllers;

use App\Domains\Setting\Models\Setting;
use App\Domains\Setting\Services\SettingService;
use App\Http\Requests\SettingRequest;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Inertia\Response;

class SettingController extends Controller
{
    public function __construct(private readonly SettingService $settingService)
    {
        $this->middleware("indexProvider")->only("index");
    }

    /**
     * Display a listing of the resource.
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize("viewAny", Setting::class);
        $requestIInputs = $request->all();
        $settings = $this->settingService->listSettings($requestIInputs);
        return Inertia::render("Setting/Index", ["settings" => $settings, "requestInputs" => $requestIInputs]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Setting $setting)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     * @throws AuthorizationException
     */
    public function update(SettingRequest $request, Setting $setting): RedirectResponse
    {
        $this->authorize("update", $setting);
        $this->settingService->updateSetting($setting, $request->validated());
        return back()->with(["success" => true, "status" => "Setting updated successfully."]);
    }

}
