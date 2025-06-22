<?php

namespace App\Domains\Laboratory\Services;


use App\Domains\Document\Enums\DocumentTag;
use App\Domains\Document\Models\Document;
use App\Domains\Laboratory\DTOs\ConsentFormDTO;
use App\Domains\Laboratory\Events\ConsentFormDocumentUpdateEvent;
use App\Domains\Laboratory\Models\ConsentForm;
use App\Domains\Laboratory\Repositories\ConsentFormRepository;
use Exception;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Arr;

readonly class ConsentFormService
{
    public function __construct(
        private ConsentFormRepository          $consentFormRepository,
    )
    {
    }

    public function listConsentForms($queryData): LengthAwarePaginator
    {
        return $this->consentFormRepository->ListConsentForms($queryData);
    }

    public function storeConsentForm(ConsentFormDTO $consentFormDTO): ConsentForm
    {
        $consentForm = $this->consentFormRepository->creatConsentForm(Arr::except($consentFormDTO->toArray(), ["document"]));
        $this->handleDocumentUpdate($consentForm, $consentFormDTO);
        return $consentForm;
    }

    public function getDocument(ConsentForm $consentForm): ?Document
    {
        $consentForm->load("document");

        return $consentForm->document;
    }


    public function updateConsentForm(ConsentForm $consentForm, ConsentFormDTO $consentFormDTO): ConsentForm
    {
        $this->consentFormRepository->updateConsentForm($consentForm, Arr::except($consentFormDTO->toArray(), ["document"]));
        $this->handleDocumentUpdate($consentForm, $consentFormDTO);
        return $consentForm;
    }

    /**
     * @throws Exception
     */
    public function deleteConsentForm(ConsentForm $consentForm): void
    {
        if (!$consentForm->tests()->exists()) {
            $consentForm->documents()->delete();
            $this->consentFormRepository->deleteConsentForm($consentForm);
        } else
            throw new Exception("This Report template group has some tests");
    }

    private function handleDocumentUpdate(ConsentForm $consentForm, ConsentFormDTO $consentFormDTO): void
    {
        if (isset($consentFormDTO->document['id']))
            ConsentFormDocumentUpdateEvent::dispatch($consentFormDTO->document['id'], $consentForm->id, DocumentTag::DOCUMENT->value);
    }
}
