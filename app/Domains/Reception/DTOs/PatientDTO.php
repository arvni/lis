<?php

namespace App\Domains\Reception\DTOs;

class PatientDTO
{
    public function __construct(
        public string       $fullName,
        public string       $idNo,
        public string       $nationality,
        public string       $dateOfBirth,
        public string       $gender,
        public string|array $avatar,
        public string       $phone,
        public ?string      $tribe,
        public ?string      $wilayat,
        public ?string      $village,
        public ?int         $id=null
    )
    {
    }

    public function toArray(): array
    {
        $data = [
            "fullName" => $this->fullName,
            "idNo" => $this->idNo,
            "nationality" => $this->nationality,
            "dateOfBirth" => $this->dateOfBirth,
            "gender" => $this->gender,
            "avatar" => $this->avatar,
            "phone" => $this->phone,
            "tribe" => $this->tribe,
            "wilayat" => $this->wilayat,
            "village" => $this->village
        ];
        if ($this->id) {
            $data["id"] = $this->id;
        }
        return $data;
    }
}
