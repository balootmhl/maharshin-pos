<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProductUpdateRequest extends FormRequest
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
            'code' => ['required', 'string', 'max:100', 'unique:products,code,' . $this->route('product')->id],
            'barcode' => ['nullable', 'string', 'max:100', 'unique:products,barcode,' . $this->route('product')->id],
            'name' => ['required', 'string'],
            'description' => ['nullable', 'string'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'unit' => ['required', 'string', 'max:50'],
            'cost_price' => ['required', 'numeric', 'between:-9999999999999.99,9999999999999.99'],
            'selling_price' => ['required', 'numeric', 'between:-9999999999999.99,9999999999999.99'],
            'tax_rate' => ['required', 'numeric', 'between:-999.99,999.99'],
            'low_stock_alert' => ['required', 'integer'],
            'is_active' => ['required'],
        ];
    }
}
