<?php

namespace App\Domains\Billing\Services;

use App\Domains\Billing\DTOs\StatementDTO;
use App\Domains\Billing\Models\Statement;
use App\Domains\Billing\Repositories\StatementRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class StatementService
{
    public function __construct(
        private readonly StatementRepository $statementRepository,
        private readonly InvoiceService      $invoiceService,

    )
    {
    }

    public function listStatements($queryData): LengthAwarePaginator
    {
        return $this->statementRepository->listStatements($queryData);
    }

    /**
     * Stores a new statement and processes related invoice updates.
     */
    public function storeStatement(StatementDTO $statementDTO): Statement
    {
        $statement = $this->statementRepository->creatStatement($statementDTO->toArray());
        if ($statementDTO->invoices) {
            $this->processInvoiceChange($statement,$statementDTO->invoices);
        }

        return $statement;
    }

    /**
     * Updates an existing statement and processes related invoice updates.
     */
    public function updateStatement(Statement $statement,StatementDTO $statementDTO): Statement
    {
        $statement->loadMissing('invoices');
        $updatedStatement = $this->statementRepository->updateStatement($statement, $statementDTO->toArray());
        $this->processInvoiceChange($statement,$statementDTO->invoices);

        return $updatedStatement;
    }

    /**
     * Finds a statement by its ID.
     */
    public function findStatementById(int $id): ?Statement // Added type hint for $id
    {
        return $this->statementRepository->findStatementById($id);
    }

    /**
     * Deletes a statement and updates the status of its associated invoice.
     */
    public function deleteStatement(Statement $statement): void
    {
        $this->statementRepository->deleteStatement($statement);
    }

    /**
     * Handles invoice updates after a statement is created or modified.
     * This includes checking if the invoice is fully paid to dispatch events,
     * and then updating the overall invoice status.
     */
    private function processInvoiceChange(Statement $statement,array $invoices): void
    {
        $this->invoiceService->updateInvoicesStatementID($statement,$invoices);
    }
}
