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
        public ?string       $phone=null,
        public ?string      $tribe,
        public ?string      $wilayat,
        public ?string      $village,
        public ?int         $id=null
    )
    {
    }

    public static function fromRequest($validatedRequest): self
    {
        return new self(
            $validatedRequest['fullName'],
            $validatedRequest['idNo'],
            is_array($validatedRequest['nationality']) ? $validatedRequest["nationality"]["code"] : $validatedRequest['nationality'],
            $validatedRequest['dateOfBirth'],
            $validatedRequest['gender'],
            $validatedRequest['avatar'],
            $validatedRequest['phone']??null,
            $validatedRequest['tribe'] ?? null,
            $validatedRequest['wilayat'] ?? null,
            $validatedRequest['village'] ?? null
        );
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
            "phone" => $this->phone??null,
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
