<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CustomerStoreRequest extends FormRequest
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
            'code' => ['required', 'string', 'max:50', 'unique:customers,code'],
            'name' => ['required', 'string'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:100'],
            'address' => ['nullable', 'string'],
            'credit_limit' => ['required', 'numeric', 'between:-9999999999999.99,9999999999999.99'],
            'current_balance' => ['required', 'numeric', 'between:-9999999999999.99,9999999999999.99'],
            'is_active' => ['required'],
        ];
    }
}
