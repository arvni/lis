<?php

namespace Tests\Feature\Laboratory;

use App\Domains\Laboratory\DTOs\ReportTemplateDTO;
use App\Domains\Laboratory\Models\ReportTemplate;
use App\Domains\Laboratory\Repositories\ReportTemplateParameterRepository;
use App\Domains\Laboratory\Repositories\ReportTemplateRepository;
use App\Domains\Laboratory\Services\ReportTemplateService;
use Exception;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\MorphOne;
use Illuminate\Pagination\LengthAwarePaginator;
use Mockery;
use Tests\TestCase;

class ReportTemplateServiceTest extends TestCase
{
    private ReportTemplateRepository $repo;
    private ReportTemplateParameterRepository $paramRepo;
    private ReportTemplateService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repo = Mockery::mock(ReportTemplateRepository::class);
        $this->paramRepo = Mockery::mock(ReportTemplateParameterRepository::class);
        $this->service = new ReportTemplateService($this->repo, $this->paramRepo);
    }

    private function dto(array $parameters = [], array $template = []): ReportTemplateDTO
    {
        $dto = Mockery::mock(ReportTemplateDTO::class);
        $dto->shouldReceive('toArray')->andReturn(['name' => 'RT']);
        $dto->parameters = $parameters;
        $dto->template = $template;
        return $dto;
    }

    /** A model whose parameters() relation accepts the deactivation sweep. */
    private function templateWithParamsRelation(): ReportTemplate
    {
        $paramsRel = Mockery::mock(HasMany::class);
        $paramsRel->shouldReceive('whereNotIn')->andReturnSelf();
        $paramsRel->shouldReceive('update')->andReturn(0);

        $rt = Mockery::mock(ReportTemplate::class)->makePartial();
        $rt->shouldReceive('parameters')->andReturn($paramsRel);
        return $rt;
    }

    public function test_list_delegates(): void
    {
        $paginator = new LengthAwarePaginator([], 0, 10);
        $this->repo->shouldReceive('ListReportTemplates')->once()->andReturn($paginator);
        $this->assertSame($paginator, $this->service->listReportTemplates([]));
    }

    public function test_store_creates_template_and_deactivates_orphan_parameters(): void
    {
        $rt = $this->templateWithParamsRelation();
        $this->repo->shouldReceive('creatReportTemplate')->once()->with(['name' => 'RT'])->andReturn($rt);

        $result = $this->service->storeReportTemplate($this->dto());
        $this->assertSame($rt, $result);
    }

    public function test_store_creates_new_parameters(): void
    {
        $rt = $this->templateWithParamsRelation();
        $rt->id = 5;
        $this->repo->shouldReceive('creatReportTemplate')->once()->andReturn($rt);

        $param = new \App\Domains\Laboratory\Models\ReportTemplateParameter();
        $param->id = 10;
        $this->paramRepo->shouldReceive('creatReportTemplateParameter')->once()
            ->with(Mockery::on(fn($a) => ($a['report_template_id'] ?? null) === 5))
            ->andReturn($param);

        $this->service->storeReportTemplate($this->dto([['label' => 'Glucose']]));
        $this->assertTrue(true);
    }

    public function test_update_existing_parameter(): void
    {
        $rt = $this->templateWithParamsRelation();
        $this->repo->shouldReceive('updateReportTemplate')->once()->andReturn($rt);

        $existing = new \App\Domains\Laboratory\Models\ReportTemplateParameter();
        $existing->id = 7;
        $this->paramRepo->shouldReceive('findById')->once()->with(7)->andReturn($existing);
        $this->paramRepo->shouldReceive('updateReportTemplateParameter')->once()->andReturn($existing);

        $this->service->updateReportTemplate($rt, $this->dto([['id' => 7, 'label' => 'Updated']]));
        $this->assertTrue(true);
    }

    public function test_get_template_returns_loaded_document(): void
    {
        $doc = new \App\Domains\Document\Models\Document();
        $rt = Mockery::mock(ReportTemplate::class)->makePartial();
        $rt->shouldReceive('load')->once()->with('template')->andReturnSelf();
        $rt->template = $doc;

        $this->assertSame($doc, $this->service->getTemplate($rt));
    }

    public function test_get_parameters_returns_active_parameters(): void
    {
        $params = new Collection();
        $rt = Mockery::mock(ReportTemplate::class)->makePartial();
        $rt->shouldReceive('load')->once()->with(['activeParameters'])->andReturnSelf();
        $rt->activeParameters = $params;

        $this->assertSame($params, $this->service->getParameters($rt));
    }

    public function test_delete_removes_template_without_tests(): void
    {
        $testsRel = Mockery::mock(BelongsToMany::class);
        $testsRel->shouldReceive('exists')->andReturn(false);
        $templateRel = Mockery::mock(MorphOne::class);
        $templateRel->shouldReceive('delete')->andReturn(1);
        $oldRel = Mockery::mock(MorphMany::class);
        $oldRel->shouldReceive('delete')->andReturn(1);

        $rt = Mockery::mock(ReportTemplate::class)->makePartial();
        $rt->shouldReceive('tests')->andReturn($testsRel);
        $rt->shouldReceive('template')->andReturn($templateRel);
        $rt->shouldReceive('oldTemplates')->andReturn($oldRel);

        $this->repo->shouldReceive('deleteReportTemplate')->once()->with($rt)->andReturnNull();

        $this->service->deleteReportTemplate($rt);
        $this->assertTrue(true);
    }

    public function test_delete_throws_when_template_has_tests(): void
    {
        $testsRel = Mockery::mock(BelongsToMany::class);
        $testsRel->shouldReceive('exists')->andReturn(true);
        $rt = Mockery::mock(ReportTemplate::class)->makePartial();
        $rt->shouldReceive('tests')->andReturn($testsRel);

        $this->repo->shouldNotReceive('deleteReportTemplate');
        $this->expectException(Exception::class);
        $this->service->deleteReportTemplate($rt);
    }
}
