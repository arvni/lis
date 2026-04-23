<?php

namespace App\Domains\Inventory\Services;

use App\Domains\Inventory\Models\Supplier;
use App\Domains\Inventory\Repositories\SupplierRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

readonly class SupplierService
{
    public function __construct(
        private SupplierRepository $supplierRepository,
    ) {}

    public function listSuppliers(array $filters): LengthAwarePaginator
    {
        return $this->supplierRepository->listSuppliers($filters);
    }

    public function createSupplier(array $data): Supplier
    {
        return $this->supplierRepository->createSupplier($data);
    }

    public function updateSupplier(Supplier $supplier, array $data): Supplier
    {
        return $this->supplierRepository->updateSupplier($supplier, $data);
    }

    public function deleteSupplier(Supplier $supplier): void
    {
        $this->supplierRepository->deleteSupplier($supplier);
    }

    public function getSupplierById(int $id): Supplier
    {
        return Supplier::with(['contacts', 'supplierItems.item'])->findOrFail($id);
    }
}
