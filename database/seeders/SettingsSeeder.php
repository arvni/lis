<?php

namespace Database\Seeders;

use App\Domains\Setting\Models\Setting;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            [
                "title" => "Max Discount Percentage",
                "key" => "maxDiscount",
                "class" => "Payment",
                "value" => ["value" => "100", "type" => "number", "max" => 100, "min" => 0]
            ],
            [
                "title" => "Min Allowable Payment Percentage",
                "key" => "minPayment",
                "class" => "Payment",
                "value" => ["value" => "7", "type" => "number", "max" => 100, "min" => 0]
            ],
            [
                "title" => "Consultation Start Time",
                "key" => "consultationStart",
                "class" => "Consultation",
                "value" => ["value" => "08:00", "type" => "time"]
            ],
            [
                "title" => "Consultation End Time",
                "key" => "consultationEnd",
                "class" => "Consultation",
                "value" => ["value" => "19:00", "type" => "time"]
            ],
            [
                "title" => "Consultation Duration (min)",
                "key" => "consultationDuration",
                "class" => "Consultation",
                "value" => ["value" => "30", "type" => "number", "min" => 0]
            ],
            [
                "title" => "VAT %",
                "key" => "vat",
                "class" => "Invoice",
                "value" => ["value" => "0", "type" => "number", "min" => 0]
            ],
            [
                "title" => "Stamp",
                "key" => "stamp",
                "class" => "Report",
                "value" => ["value" => "", "type" => "image",]
            ],
            [
                "title" => "Clinical Report Template",
                "key" => "clinicalReport",
                "class" => "Report",
                "value" => ["value" => "", "type" => "file",]
            ],
            [
                "title" => "Default Report Template",
                "key" => "defaultReportTemplate",
                "class" => "Report",
                "value" => ["value" => "", "type" => "file",]
            ]
        ];
        foreach ($settings as $settingData) {
            $setting = Setting::where(["class" => $settingData["class"], "key" => $settingData["key"]])->first();
            if (!$setting) {
                Setting::create($settingData);
            }
        }
    }
}
