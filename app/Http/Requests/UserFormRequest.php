<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UserFormRequest extends FormRequest
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
        $userId = $this->route('user')?->id;

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'lowercase',
                'email',
                'regex:/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/',
                'max:255',
                $userId
                    ? Rule::unique(User::class)->ignore($userId)
                    : Rule::unique(User::class),
            ],
            'password' => $userId
                ? ['nullable', Password::defaults()]
                : ['required', Password::defaults()],
            'main_role' => ['required', 'string'],
            'branch_id' => [
                Rule::requiredIf(fn () => $this->input('main_role') !== config('project.super_admin', 'god')),
                'nullable',
                'exists:branches,id',
            ],
        ];
    }
}
