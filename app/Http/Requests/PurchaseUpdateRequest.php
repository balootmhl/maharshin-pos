<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PurchaseUpdateRequest extends FormRequest
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
            'purchase_no' => ['required', 'string', 'max:50', 'unique:purchases,purchase_no'],
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
            'supplier_id' => ['nullable', 'integer', 'exists:suppliers,id'],
            'purchase_date' => ['required', 'date'],
            'subtotal' => ['required', 'numeric', 'between:-9999999999999.99,9999999999999.99'],
            'tax_amount' => ['required', 'numeric', 'between:-9999999999999.99,9999999999999.99'],
            'total_amount' => ['required', 'numeric', 'between:-9999999999999.99,9999999999999.99'],
            'payment_status' => ['required', 'string', 'max:50'],
            'paid_amount' => ['required', 'numeric', 'between:-9999999999999.99,9999999999999.99'],
            'notes' => ['nullable', 'string'],
            'created_by' => ['nullable'],
            'creator_id' => ['required', 'integer', 'exists:Users,id'],
        ];
    }
}
