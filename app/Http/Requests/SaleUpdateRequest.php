<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SaleUpdateRequest extends FormRequest
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
            'invoice_no' => ['required', 'string', 'max:50', 'unique:sales,invoice_no'],
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
            'customer_id' => ['nullable', 'integer', 'exists:customers,id'],
            'sale_date' => ['required', 'date'],
            'subtotal' => ['required', 'numeric', 'between:-9999999999999.99,9999999999999.99'],
            'tax_amount' => ['required', 'numeric', 'between:-9999999999999.99,9999999999999.99'],
            'discount_amount' => ['required', 'numeric', 'between:-9999999999999.99,9999999999999.99'],
            'total_amount' => ['required', 'numeric', 'between:-9999999999999.99,9999999999999.99'],
            'payment_status' => ['required', 'string', 'max:50'],
            'payment_method' => ['nullable', 'string', 'max:50'],
            'paid_amount' => ['required', 'numeric', 'between:-9999999999999.99,9999999999999.99'],
            'credit_amount' => ['required', 'numeric', 'between:-9999999999999.99,9999999999999.99'],
            'notes' => ['nullable', 'string'],
            'created_by' => ['nullable'],
            'creator_id' => ['required', 'integer', 'exists:Users,id'],
        ];
    }
}
