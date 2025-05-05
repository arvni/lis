<?php

namespace App\Domains\Laboratory\Services;


use App\Domains\Document\Enums\DocumentTag;
use App\Domains\Document\Models\Document;
use App\Domains\Laboratory\DTOs\ReportTemplateDTO;
use App\Domains\Laboratory\Events\ReportTemplateDocumentUpdateEvent;
use App\Domains\Laboratory\Models\ReportTemplate;
use App\Domains\Laboratory\Repositories\ReportTemplateParameterRepository;
use App\Domains\Laboratory\Repositories\ReportTemplateRepository;
use Exception;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Arr;

readonly class ReportTemplateService
{
    public function __construct(
        private ReportTemplateRepository          $reportTemplateRepository,
        private ReportTemplateParameterRepository $reportTemplateParameterRepository,
    )
    {
    }

    public function listReportTemplates($queryData): LengthAwarePaginator
    {
        return $this->reportTemplateRepository->ListReportTemplates($queryData);
    }

    public function storeReportTemplate(ReportTemplateDTO $reportTemplateDTO): ReportTemplate
    {
        $reportTemplate = $this->reportTemplateRepository->creatReportTemplate(Arr::except($reportTemplateDTO->toArray(), ["parameters", "template"]));
        $this->handleDocumentUpdate($reportTemplate, $reportTemplateDTO);
        $this->handleUpdateOrCreateParameters($reportTemplate, $reportTemplateDTO->parameters);
        return $reportTemplate;
    }

    public function getTemplate(ReportTemplate $reportTemplate): ?Document
    {
        $reportTemplate->load("template");

        return $reportTemplate->template;
    }

    public function getParameters(ReportTemplate $reportTemplate): Collection
    {
        $reportTemplate->load(["activeParameters"]);

        return $reportTemplate->activeParameters;
    }

    public function updateReportTemplate(ReportTemplate $reportTemplate, ReportTemplateDTO $reportTemplateDTO): ReportTemplate
    {
        $this->reportTemplateRepository->updateReportTemplate($reportTemplate, Arr::except($reportTemplateDTO->toArray(), ["parameters", "template"]));
        $this->handleDocumentUpdate($reportTemplate, $reportTemplateDTO);
        $this->handleUpdateOrCreateParameters($reportTemplate, $reportTemplateDTO->parameters);
        return $reportTemplate;
    }

    /**
     * @throws Exception
     */
    public function deleteReportTemplate(ReportTemplate $reportTemplate): void
    {
        if (!$reportTemplate->tests()->exists()) {
            $this->reportTemplateRepository->deleteReportTemplate($reportTemplate);
            $reportTemplate->template()->delete();
            $reportTemplate->oldTemplates()->delete();
        } else
            throw new Exception("This Report template group has some tests");
    }

    private function handleDocumentUpdate(ReportTemplate $reportTemplate, ReportTemplateDTO $reportTemplateDTO): void
    {
        if (isset($reportTemplateDTO->template['id']))
            ReportTemplateDocumentUpdateEvent::dispatch($reportTemplateDTO->template['id'], $reportTemplate->id, DocumentTag::LATEST->value);
    }

    private function handleUpdateOrCreateParameters(ReportTemplate $reportTemplate, array $parameters): void
    {
        $ids = [];
        foreach ($parameters as $parameterData) {
            if (isset($parameterData['id'])) {
                $parameter = $this->reportTemplateParameterRepository->findById($parameterData['id']);
                if ($parameter)
                    $parameter = $this->reportTemplateParameterRepository->updateReportTemplateParameter($parameter, Arr::except($parameterData, ["id"]));
                else if (is_array($parameterData))
                    $parameter = $this->reportTemplateParameterRepository->creatReportTemplateParameter([...$parameterData, "report_template_id" => $reportTemplate->id]);
            } else
                $parameter = $this->reportTemplateParameterRepository->creatReportTemplateParameter([...$parameterData, "report_template_id" => $reportTemplate->id]);
            $ids[] = $parameter->id;
        }
        $reportTemplate->parameters()->whereNotIn("id", $ids)->update(["active" => false]);
    }
}
