<?php

namespace App\Domains\Reception\Requests;

use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Reception\Enums\AcceptanceStatus;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateAcceptanceRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows("update", $this->route()->parameter("acceptance")) ||
            (
            Gate::allows("create", $this->route()->parameter("acceptance") &&
                $this->route()->parameter("acceptance")->status == AcceptanceStatus::PENDING)
            );
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules()
    {
        // Get the current step from the request
        $step = $this->input('step', 5); // Default to final step if not specified

        // Base rules that apply to all steps
        $rules = [
            "step" => ["numeric"],
        ];

        // Add step-specific validation rules
        switch ($step) {
            case 0: // Patient Information
                // Usually read-only, no additional validation
                break;

            case 1: // Consultation Request
                // Optional consultation fields
                if ($this->has('needsConsultation') && $this->input('needsConsultation')) {
                    $rules['consultation_id'] = 'nullable|exists:consultations,id';
                }
                break;

            case 2: // Doctor & Referral
                // Doctor Information
                $rules['doctor.id'] = 'nullable';
                $rules['doctor.name'] = 'nullable|string|max:255';
                $rules['doctor.expertise'] = 'nullable|string|max:255';
                $rules['doctor.phone'] = 'nullable|string|max:20';
                $rules['doctor.licenseNo'] = 'nullable|string|max:255';

                // Referral Information
                $rules['referred'] = 'boolean';
                $rules['referrer'] = [
                    'required_if:referred,true',
                    'nullable',
                    'array',
                ];
                $rules['referrer.id'] = [
                    'required_if:referred,true',
                    'nullable',
                    'exists:referrers,id'
                ];
                $rules['referenceCode'] = 'nullable|string|max:255';
                break;

            case 3: // Tests Selection
                // Tests & Panels
                $rules['acceptanceItems'] = 'required|array';
                $rules['acceptanceItems.tests'] = 'nullable|array';
                $rules['acceptanceItems.tests.*.id'] = 'nullable';
                $rules['acceptanceItems.tests.*.no_sample'] = 'nullable';
                $rules['acceptanceItems.tests.*.method_test.id'] = 'required|exists:method_tests,id';
                $rules['acceptanceItems.tests.*.customParameters.sampleType'] = 'nullable|exists:sample_types,id';
                $rules['acceptanceItems.tests.*.customParameters.price'] = 'nullable|array';
                $rules['acceptanceItems.tests.*.price'] = 'required|numeric|min:0';
                $rules['acceptanceItems.tests.*.discount'] = [
                    'nullable',
                    'numeric',
                    'min:0',
                    function ($attribute, $value, $fail) {
                        $index = explode('.', $attribute)[2];
                        $price = $this->input("acceptanceItems.tests.{$index}.price");

                        if ($value > $price) {
                            $fail('The discount cannot be greater than the price.');
                        }

                        // Add max discount check if maxDiscount is provided
                        if (request()->has('maxDiscount')) {
                            $maxDiscountAmount = request()->maxDiscount * $price * 0.01;
                            if ($value > $maxDiscountAmount) {
                                $fail("The discount cannot exceed " . request()->maxDiscount . "% of the price.");
                            }
                        }
                    },
                ];
                $rules['acceptanceItems.tests.*.samples'] = 'nullable|array|min:1';
                $rules['acceptanceItems.tests.*.samples.*'] = 'nullable|array|min:1';
                $rules['acceptanceItems.tests.*.samples.*.patients.*.id'] = 'nullable|exists:patients,id';
                $rules['acceptanceItems.tests.*.samples.*.sampleType'] = 'nullable|exists:sample_types,id';
                $rules['acceptanceItems.tests.*.details'] = 'nullable|string|max:500';
                $rules['acceptanceItems.tests.*.customParameters.discounts'] = 'nullable|array';


                $rules['acceptanceItems.services'] = 'nullable|array';
                $rules['acceptanceItems.services.*.id'] = 'nullable';
                $rules['acceptanceItems.services.*.method_test.id'] = 'required|exists:method_tests,id';
                $rules['acceptanceItems.services.*.customParameters.price'] = 'nullable|array';
                $rules['acceptanceItems.services.*.price'] = 'required|numeric|min:0';
                $rules['acceptanceItems.services.*.discount'] = [
                    'nullable',
                    'numeric',
                    'min:0',
                    function ($attribute, $value, $fail) {
                        $index = explode('.', $attribute)[2];
                        $price = $this->input("acceptanceItems.services.{$index}.price");

                        if ($value > $price) {
                            $fail('The discount cannot be greater than the price.');
                        }

                        // Add max discount check if maxDiscount is provided
                        if (request()->has('maxDiscount')) {
                            $maxDiscountAmount = request()->maxDiscount * $price * 0.01;
                            if ($value > $maxDiscountAmount) {
                                $fail("The discount cannot exceed " . request()->maxDiscount . "% of the price.");
                            }
                        }
                    },
                ];
                $rules['acceptanceItems.services.*.details'] = 'nullable|string|max:500';
                $rules['acceptanceItems.services.*.customParameters.discounts'] = 'nullable|array';

                // Panel validations
                $rules['acceptanceItems.panels'] = 'nullable|array';
                $rules['acceptanceItems.panels.*.id'] = 'nullable|string';
                $rules['acceptanceItems.panels.*.panel.id'] = 'required|exists:tests,id';
                $rules['acceptanceItems.panels.*.price'] = 'nullable|numeric|min:0';
                $rules['acceptanceItems.panels.*.discount'] = [
                    'nullable',
                    'numeric',
                    'min:0',
                    function ($attribute, $value, $fail) {
                        $index = explode('.', $attribute)[2];
                        $price = $this->input("acceptanceItems.panels.{$index}.panel.price");

                        if ($value > $price) {
                            $fail('The discount cannot be greater than the price.');
                        }

                        // Add max discount check if maxDiscount is provided
                        if (request()->has('maxDiscount')) {
                            $maxDiscountAmount = request()->maxDiscount * $price * 0.01;
                            if ($value > $maxDiscountAmount) {
                                $fail("The discount cannot exceed " . request()->maxDiscount . "% of the price.");
                            }
                        }
                    },
                ];
                $rules['acceptanceItems.panels.*.acceptanceItems'] = 'required|array';
                $rules['acceptanceItems.panels.*.acceptanceItems.*.id'] = 'nullable';
                $rules['acceptanceItems.panels.*.acceptanceItems.*.no_sample'] = 'nullable';
                $rules['acceptanceItems.panels.*.acceptanceItems.*.method_test.id'] = 'required|exists:method_tests,id';
                $rules['acceptanceItems.panels.*.acceptanceItems.*.samples'] = 'nullable|array|min:1';
                $rules['acceptanceItems.panels.*.acceptanceItems.*.samples.*.sampleType'] = 'nullable|exists:sample_types,id';
                $rules['acceptanceItems.panels.*.acceptanceItems.*.samples.*.patients'] = 'nullable|array|min:1';
                $rules['acceptanceItems.panels.*.acceptanceItems.*.samples.*.patients.*.id'] = 'nullable|exists:patients,id';
                $rules['acceptanceItems.panels.*.acceptanceItems.*.details'] = 'nullable|string|max:500';
                $rules['acceptanceItems.panels.*.acceptanceItems.*.customParameters.price'] = 'nullable|array';
                $rules['acceptanceItems.panels.*.acceptanceItems.*.customParameters.discounts'] = 'nullable|array';
                break;

            case 4: // Sampling & Delivery
                // Sampling Information
                $rules['samplerGender'] = [
                    Rule::excludeIf(fn() => $this->checkIstthereAnyTestOnRequest()),
                    'required',
                    'in:0,1'];
                $rules['out_patient'] = 'boolean';

                // Report Information
                $rules['referred'] = 'boolean';

                // Ensure at least one delivery method is selected when not referred
                $rules['howReport'] = [
                    Rule::excludeIf(fn() => $this->checkIstthereAnyTestOnRequest()),
                    'required_if:referred,false',
                    function ($attribute, $value, $fail) {
                        if ($this->input('referred') === false &&
                            (!isset($value['print']) && !isset($value['email']) && !isset($value['whatsapp']))) {
                            $fail('Please select at least one report delivery method.');
                        }
                    },
                ];

                // Print report validation
                $rules['howReport.print'] = 'boolean';
                $rules['howReport.printReceiver'] = [
                    'required_if:howReport.print,true',
                    'string',
                    'max:255',
                ];

                // Email report validation
                $rules['howReport.email'] = 'boolean';
                $rules['howReport.emailAddress'] = [
                    'required_if:howReport.email,true',
                    'email:rfc,dns',
                    'max:255',
                ];

                // WhatsApp report validation
                $rules['howReport.whatsapp'] = 'boolean';
                $rules['howReport.whatsappNumber'] = [
                    'required_if:howReport.whatsapp,true',
                    'string',
                    'max:20',
                    'regex:/^[+\d\s\-()]{7,20}$/',
                ];

                // Send to referrer option
                $rules['howReport.sendToReferrer'] = [
                    'boolean',
                    'nullable',
                    function ($attribute, $value, $fail) {
                        if ($value === true && $this->input('referred') === false) {
                            $fail('Cannot send to referrer when not referred.');
                        }
                    },
                ];
                break;

            case 5: // Review & Submit (Full validation)
            default:
                $rules['patient_id'] = 'required';
                $rules['acceptor_id'] = 'nullable';
                // Sampling Information
                $rules['samplerGender'] = 'required|in:0,1';
                $rules['out_patient'] = 'boolean';

                // Report Information
                $rules['referred'] = 'boolean';

                // Ensure at least one delivery method is selected when not referred
                $rules['howReport'] = [
                    'required_if:referred,false',
                    function ($attribute, $value, $fail) {
                        if ($this->input('referred') === false &&
                            (!isset($value['print']) && !isset($value['email']) && !isset($value['whatsapp']))) {
                            $fail('Please select at least one report delivery method.');
                        }
                    },
                ];

                // Print report validation
                $rules['howReport.print'] = 'boolean';
                $rules['howReport.printReceiver'] = [
                    'required_if:howReport.print,true',
                    'string',
                    'max:255',
                ];

                // Email report validation
                $rules['howReport.email'] = 'boolean';
                $rules['howReport.emailAddress'] = [
                    'required_if:howReport.email,true',
                    'email:rfc,dns',
                    'max:255',
                ];

                // WhatsApp report validation
                $rules['howReport.whatsapp'] = 'boolean';
                $rules['howReport.whatsappNumber'] = [
                    'required_if:howReport.whatsapp,true',
                    'string',
                    'max:20',
                    'regex:/^[+\d\s\-()]{7,20}$/',
                ];

                // Send to referrer option
                $rules['howReport.sendToReferrer'] = [
                    'boolean',
                    'nullable',
                    function ($attribute, $value, $fail) {
                        if ($value === true && $this->input('referred') === false) {
                            $fail('Cannot send to referrer when not referred.');
                        }
                    },
                ];


                // Referral Information
                $rules['referred'] = 'boolean';
                $rules['referrer'] = [
                    'required_if:referred,true',
                    'nullable',
                    'array',
                ];
                $rules['referrer.id'] = [
                    'required_if:referred,true',
                    'nullable',
                    'exists:referrers,id'
                ];
                $rules['referenceCode'] = 'nullable|string|max:255';

                // Doctor Information
                $rules['doctor.id'] = 'nullable';
                $rules['doctor.name'] = 'nullable|string|max:255';
                $rules['doctor.expertise'] = 'nullable|string|max:255';
                $rules['doctor.phone'] = 'nullable|string|max:20';
                $rules['doctor.licenseNo'] = 'nullable|string|max:255';

                // Tests & Panels
                $rules['acceptanceItems'] = 'required|array';
                $rules['acceptanceItems.tests'] = 'nullable|array';
                $rules['acceptanceItems.tests.*.id'] = 'nullable';
                $rules['acceptanceItems.tests.*.method_test.id'] = 'required|exists:method_tests,id';
                $rules['acceptanceItems.tests.*.customParameters.sampleType'] = 'nullable|exists:sample_types,id';
                $rules['acceptanceItems.tests.*.customParameters.price'] = 'nullable|array';
                $rules['acceptanceItems.tests.*.price'] = 'required|numeric|min:0';
                $rules['acceptanceItems.tests.*.discount'] = [
                    'nullable',
                    'numeric',
                    'min:0',
                    function ($attribute, $value, $fail) {
                        $index = explode('.', $attribute)[2];
                        $price = $this->input("acceptanceItems.tests.{$index}.price");

                        if ($value > $price) {
                            $fail('The discount cannot be greater than the price.');
                        }

                        // Add max discount check if maxDiscount is provided
                        if (request()->has('maxDiscount')) {
                            $maxDiscountAmount = request()->maxDiscount * $price * 0.01;
                            if ($value > $maxDiscountAmount) {
                                $fail("The discount cannot exceed " . request()->maxDiscount . "% of the price.");
                            }
                        }
                    },
                ];
                $rules['acceptanceItems.tests.*.samples'] = 'nullable|array|min:1';
                $rules['acceptanceItems.tests.*.samples.*.patients'] = 'nullable|array|min:1';
                $rules['acceptanceItems.tests.*.samples.*.sampleType'] = 'nullable|exists:sample_types,id';
                $rules['acceptanceItems.tests.*.samples.*.patients.*.id'] = 'nullable|exists:patients,id';
                $rules['acceptanceItems.tests.*.details'] = 'nullable|string|max:500';

                // Panel validations
                $rules['acceptanceItems.panels'] = 'nullable|array';
                $rules['acceptanceItems.panels.*.id'] = 'nullable|string';
                $rules['acceptanceItems.panels.*.panel.id'] = 'required|exists:tests,id';
                $rules['acceptanceItems.panels.*.price'] = 'nullable|numeric|min:0';
                $rules['acceptanceItems.panels.*.discount'] = [
                    'nullable',
                    'numeric',
                    'min:0',
                    function ($attribute, $value, $fail) {
                        $index = explode('.', $attribute)[2];
                        $price = $this->input("acceptanceItems.panels.{$index}.panel.price");

                        if ($value > $price) {
                            $fail('The discount cannot be greater than the price.');
                        }

                        // Add max discount check if maxDiscount is provided
                        if (request()->has('maxDiscount')) {
                            $maxDiscountAmount = request()->maxDiscount * $price * 0.01;
                            if ($value > $maxDiscountAmount) {
                                $fail("The discount cannot exceed " . request()->maxDiscount . "% of the price.");
                            }
                        }
                    },
                ];
                $rules['acceptanceItems.panels.*.acceptanceItems'] = 'required|array';
                $rules['acceptanceItems.panels.*.acceptanceItems.*.id'] = 'nullable';
                $rules['acceptanceItems.panels.*.acceptanceItems.*.method_test.id'] = 'required|exists:method_tests,id';
                $rules['acceptanceItems.panels.*.acceptanceItems.*.customParameters.sampleType'] = 'nullable|exists:sample_types,id';
                $rules['acceptanceItems.panels.*.acceptanceItems.*.samples'] = 'nullable|array|min:1';
                $rules['acceptanceItems.panels.*.acceptanceItems.*.samples.*.patients'] = 'nullable|array|min:1';
                $rules['acceptanceItems.panels.*.acceptanceItems.*.samples.*.sampleType'] = 'nullable|exists:sample_types,id';
                $rules['acceptanceItems.panels.*.acceptanceItems.*.samples.*.patients.*.id'] = 'nullable|exists:patients,id';
                $rules['acceptanceItems.panels.*.acceptanceItems.*.details'] = 'nullable|string|max:500';

                // Optional Prescription
                $rules['prescription.id'] = 'nullable|exists:documents,id';
                break;
        }

        return $rules;
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array
     */
    public function attributes()
    {
        return [
            'samplerGender' => 'sampler gender',
            'howReport.way' => 'reporting method',
            'howReport.who' => 'report receiver',
            'doctor.name' => 'doctor name',
            'doctor.expertise' => 'doctor expertise',
            'doctor.phone' => 'doctor phone',
            'doctor.licenseNo' => 'doctor license number',
            'acceptanceItems.tests' => 'tests',
            'acceptanceItems.panels' => 'panels',
            'acceptanceItems.tests.*.method_test.id' => 'test method',
            'acceptanceItems.tests.*.sample_type' => 'sample type',
            'acceptanceItems.tests.*.price' => 'test price',
            'acceptanceItems.tests.*.discount' => 'test discount',
            'acceptanceItems.tests.*.samples.*.*.id' => 'test patient',
            'acceptanceItems.panels.*.panel.id' => 'panel',
            'acceptanceItems.panels.*.price' => 'panel price',
            'acceptanceItems.panels.*.discount' => 'panel discount',
            'acceptanceItems.panels.*.acceptanceItems.*.method_test.id' => 'panel test method',
            'acceptanceItems.panels.*.acceptanceItems.*.sample_type' => 'panel sample type',
            'acceptanceItems.panels.*.acceptanceItems.*.patients.*.id' => 'panel test patient',
        ];
    }

    /**
     * Get the error messages for the defined validation rules.
     *
     * @return array
     */
    public function messages()
    {
        return [
            'patient.id.required' => 'A patient must be selected.',
            'acceptanceItems.required' => 'At least one test or panel must be selected.',
            'howReport.way.required_if' => 'Please select how to receive the report.',
            'howReport.who.required_if' => 'Please provide who will receive the report.',
            'referrer.required_if' => 'Please select a referrer.',
            'acceptanceItems.tests.*.method_test.id.required' => 'Please select a test method.',
            'acceptanceItems.tests.*.sample_type.required' => 'Please select a sample type for the test.',
            'acceptanceItems.tests.*.samples.required' => 'Please select at least one patient for the test.',
            'acceptanceItems.panels.*.panel.id.required' => 'Please select a panel.',
            'acceptanceItems.panels.*.acceptanceItems.*.sample_type.required' => 'Please select a sample type for each panel test.',
            'acceptanceItems.panels.*.acceptanceItems.*.patients.required' => 'Please select patient(s) for each panel test.',
        ];
    }

    /**
     * Custom validation logic before the standard validation runs.
     *
     * @param Validator $validator
     * @return void
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            // Only perform these additional validations if we're on the tests step (3) or final step (5)
            $step = $this->input('step', 5);
            if ($step != 3 && $step != 5) {
                return;
            }

            $tests = $this->input('acceptanceItems.tests', []);
            $panels = $this->input('acceptanceItems.panels', []);
            $services = $this->input('acceptanceItems.services', []);

            // Verify at least one test or panel is selected
            if (empty($tests) && empty($panels) && empty($services)) {
                $validator->errors()->add('acceptanceItems', 'Please select at least one test or panel.');
            }
        });
    }

    private function checkIstThereAnyTestOnRequest(): bool
    {
        return (count($this->input("acceptanceItems.panels", [])) +
                collect($this->input("acceptanceItems.tests", []))->filter(fn($item) => $item["method_test"]["test"]["type"] == TestType::TEST->value)->count()
            ) < 1 ||
            $this->input("out_patient");
    }
}
