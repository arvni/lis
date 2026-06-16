<?php

namespace Tests\Feature\Setting;

use App\Domains\Setting\Models\Setting;
use App\Domains\Setting\Repositories\SettingRepository;
use App\Domains\Setting\Services\SettingService;
use Mockery;
use Tests\TestCase;

class SettingServiceTest extends TestCase
{
    private SettingRepository $repo;
    private SettingService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repo = Mockery::mock(SettingRepository::class);
        $this->service = new SettingService($this->repo);
    }

    private function setting(string $type): Setting
    {
        $setting = new Setting();
        $setting->setRawAttributes(['value' => json_encode(['type' => $type, 'value' => 'old'])]);
        return $setting;
    }

    public function test_list_delegates(): void
    {
        $paginator = new \Illuminate\Pagination\LengthAwarePaginator([], 0, 10);
        $this->repo->shouldReceive('ListSettings')->once()->with(['q' => 1])->andReturn($paginator);
        $this->assertSame($paginator, $this->service->listSettings(['q' => 1]));
    }

    public function test_get_by_key_delegates(): void
    {
        $this->repo->shouldReceive('getSettingsByClassAndKey')->once()->with('App', 'k')->andReturn('VAL');
        $this->assertSame('VAL', $this->service->getSettingByKey('App', 'k'));
    }

    public function test_update_default_type_persists_raw_value(): void
    {
        $setting = $this->setting('text');
        $captured = null;
        $this->repo->shouldReceive('updateSetting')->once()->andReturnUsing(function ($s, $v) use (&$captured, $setting) {
            $captured = $v;
            return $setting;
        });

        $this->service->updateSetting($setting, ['value' => ['value' => 'hello']]);
        $this->assertSame('hello', $captured);
    }

    public function test_update_password_encrypts_value(): void
    {
        $setting = $this->setting('password');
        $captured = null;
        $this->repo->shouldReceive('updateSetting')->once()->andReturnUsing(function ($s, $v) use (&$captured, $setting) {
            $captured = $v;
            return $setting;
        });

        $this->service->updateSetting($setting, ['value' => ['value' => 'secret']]);
        $this->assertSame('secret', decrypt($captured));
    }

    public function test_update_password_blank_is_skipped(): void
    {
        $setting = $this->setting('password');
        $this->repo->shouldNotReceive('updateSetting');

        $result = $this->service->updateSetting($setting, ['value' => ['value' => '']]);
        $this->assertSame($setting, $result);
    }
}
