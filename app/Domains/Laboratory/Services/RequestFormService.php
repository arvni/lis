<?php

namespace App\Domains\Laboratory\Services;


use App\Domains\Document\Enums\DocumentTag;
use App\Domains\Laboratory\DTOs\RequestFormDTO;
use App\Domains\Laboratory\Events\RequestFormDocumentUpdateEvent;
use App\Domains\Laboratory\Models\RequestForm;
use App\Domains\Laboratory\Repositories\RequestFormRepository;
use Exception;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

readonly class RequestFormService
{
    public function __construct(private RequestFormRepository $requestFormRepository)
    {
    }

    public function listRequestForms($queryData): LengthAwarePaginator
    {
        return $this->requestFormRepository->ListRequestForms($queryData);
    }

    public function storeRequestForm(RequestFormDTO $requestFormDTO): RequestForm
    {
        $requestForm = $this->requestFormRepository->creatRequestForm($requestFormDTO->toArray());
        $this->handleDocumentUpdate($requestForm, $requestFormDTO);
        return $requestForm;
    }

    public function updateRequestForm(RequestForm $requestForm, RequestFormDTO $requestFormDTO): RequestForm
    {
        $updatedRequestForm = $this->requestFormRepository->updateRequestForm($requestForm, $requestFormDTO->toArray());
        $this->handleDocumentUpdate($requestForm, $requestFormDTO);
        return $updatedRequestForm;
    }

    /**
     * @throws Exception
     */
    public function deleteRequestForm(RequestForm $requestForm): void
    {
        if (!$requestForm->tests()->exists()) {
            $this->requestFormRepository->deleteRequestForm($requestForm);
        } else
            throw new Exception("This requestForm has some Tests");
    }

    public function getRequestFormById($id): RequestForm
    {
        return $this->requestFormRepository->getRequestFormById($id);
    }


    private function handleDocumentUpdate(RequestForm $requestForm, RequestFormDTO $requestFormDTO): void
    {
        if (isset($requestFormDTO->document['id']))
            RequestFormDocumentUpdateEvent::dispatch($requestFormDTO->document['id'], $requestForm->id, DocumentTag::DOCUMENT->value);
    }
}
