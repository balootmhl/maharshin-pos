<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CustomerPaymentStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'payment_no' => ['required', 'string', 'max:50', 'unique:customer_payments,payment_no'],
            'customer_id' => ['required', 'integer', 'exists:customers,id'],
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
            'payment_date' => ['required', 'date'],
            'amount' => ['required', 'numeric', 'between:-9999999999999.99,9999999999999.99'],
            'payment_method' => ['required', 'string', 'max:50'],
            'reference_no' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
            'created_by' => ['nullable'],
            'created_at' => ['required'],
            'updated_at' => ['required'],
            'creator_id' => ['required', 'integer', 'exists:Users,id'],
        ];
    }
}
