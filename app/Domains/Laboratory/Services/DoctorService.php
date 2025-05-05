<?php

namespace App\Domains\Laboratory\Services;


use App\Domains\Laboratory\DTOs\DoctorDTO;
use App\Domains\Laboratory\Models\Doctor;
use App\Domains\Laboratory\Repositories\DoctorRepository;
use Exception;

class DoctorService
{
    public function __construct(private DoctorRepository $doctorRepository)
    {
    }

    public function listDoctors($queryData)
    {
        return $this->doctorRepository->ListDoctors($queryData);
    }

    public function storeDoctor(DoctorDTO $doctorDTO)
    {
        return $this->doctorRepository->creatDoctor($doctorDTO->toArray());
    }

    public function updateDoctor(Doctor $doctor, DoctorDTO $doctorDTO): Doctor
    {
        return $this->doctorRepository->updateDoctor($doctor, $doctorDTO->toArray());
    }

    /**
     * @throws Exception
     */
    public function deleteDoctor(Doctor $doctor): void
    {
        if (!$doctor->methods()->exists()) {
            $this->doctorRepository->deleteDoctor($doctor);
        } else
            throw new Exception("This Doctor has some Acceptances");
    }

    public function createOrGetDoctor(array $data): Doctor
    {
        $doctor = $this->doctorRepository->getDoctorByName($data["name"]);
        if (!$doctor)
            $doctor = $this->doctorRepository->creatDoctor($data);
        return $doctor;
    }
}
