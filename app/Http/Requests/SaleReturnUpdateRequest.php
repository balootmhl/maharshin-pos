<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SaleReturnUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        if ($this->user() && !$this->user()->is_super_admin) {
            $this->merge(['branch_id' => $this->user()->branch_id]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'return_no' => ['required', 'string', 'max:50', 'unique:sale_returns,return_no,' . $this->route('sale_return')->id],
            'sale_id' => ['required', 'integer', 'exists:sales,id'],
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
            'return_date' => ['required', 'date'],
            'total_amount' => ['required', 'numeric', 'between:-9999999999999.99,9999999999999.99'],
            'refund_amount' => ['required', 'numeric', 'between:-9999999999999.99,9999999999999.99'],
            'refund_method' => ['nullable', 'string', 'max:50'],
            'reason' => ['nullable', 'string'],
            'created_by' => ['nullable'],
            'creator_id' => ['required', 'integer', 'exists:Users,id'],
        ];
    }
}
