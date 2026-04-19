# Codebase Guide

This guide serves to help onboard any new developer or AI agent rapidly. It outlines the core technology stack, project structural conventions, and the key paradigms used in this application.

## Tech Stack & Versions
- **Backend Framework**: Laravel 12 (PHP `^8.2`)
- **Frontend Framework**: React 19 via InertiaJS (`^2.0`)
- **CSS Framework**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **Package Manager**: pnpm
- **Key Backend Packages**:
  - `spatie/laravel-query-builder` (Simplifies advanced API/Index filtering, sorting)
  - `spatie/laravel-permission` (Roles/Permissions enforcement)
  - `maatwebsite/excel` (Excel/CSV Exporting wrappers)
  - `lab404/laravel-impersonate` (Login impersonation tooling)
- **Key Frontend Packages**:
  - Radix UI primitives (`@radix-ui/react-*`)
  - Shadcn/ui ecosystem (`class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`)
  - `@tanstack/react-table` (DataTable structures)
  - `recharts` for charting.

## Directory Structure
- `app/Http/Controllers`: Contains both generic resourceful controllers and API specific (`Api/`) controllers.
- `app/Models`: Contains Eloquent models, largely extending a common `BaseModel`.
- `app/Http/Requests`: Contains dedicated FormRequests for strict validation encapsulation.
- `resources/js/Pages`: NextJS-style Inertia page components, structured hierarchically by Resource/Domain (e.g., `Customer/create.tsx`).
- `resources/js/components`: Shared UI component directory:
  - `ui/`: Standard un-modified elements originating from Shadcn UI.
  - `inputs/`: Custom project-specific input wrappers like `smart-select.tsx`.
- `routes/web.php`: Primary monolithic routing configuration grouping middleware layers.

---

## Model Conventions
Models inherit from `App\Models\BaseModel` and enforce strict casting. `SoftDeletes` and `HasFactory` are widely utilized.
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends BaseModel
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code', 'name', 'phone', 'is_active',
    ];

    // Explicit casting is highly encouraged
    protected $casts = [
        'id' => 'integer',
        'credit_limit' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }
}
```

---

## Controller Patterns
Controllers default to clean CRUD implementations utilizing `Route::resource()`. `Spatie\QueryBuilder` handles logic to structure API or Inertia table datasets.
```php
<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Spatie\QueryBuilder\QueryBuilder;
use Spatie\QueryBuilder\AllowedFilter;

class CustomerController extends Controller
{
    public function index(Request $request): Response
    {
        // Spatie QueryBuilder simplifies filtering and sorting inputs dynamically
        $customers = QueryBuilder::for(Customer::class)
            ->allowedFilters(['name', 'phone', AllowedFilter::exact('is_active')])
            ->allowedSorts(['name', 'created_at'])
            ->defaultSort('name')
            ->paginate($request->input('per_page', 25))
            ->withQueryString();

        return Inertia::render('Customer/index', ['customers' => $customers]);
    }

    public function create(): Response
    {
        return Inertia::render('Customer/create');
    }

    public function store(CustomerStoreRequest $request): RedirectResponse
    {
        $customer = Customer::create($request->validated());
        
        // Flash IDs to the session for success states
        $request->session()->flash('customer.id', $customer->id);
        
        return redirect()->route('customers.index');
    }
}
```

---

## Route Registration Pattern
Routes heavily utilize `Route::resource` wrapped inside grouped middleware blocks. 
*Note:* Nested utility routes (e.g., exports, restores) are explicitly registered prior to the main `Route::resource` route hook to avoid false `{item}` parameter collisions.
```php
Route::middleware(['auth', 'verified'])->group(function () {
    
    // Custom granular actions MUST be positioned before the resource declaration
    Route::get('customers/{customer}/credit-ledger/export', [CustomerController::class, 'exportCreditLedger'])
         ->name('customers.credit-ledger.export');
         
    // Standard Restful bindings
    Route::resource('customers', CustomerController::class);

    // API search endpoints leveraged within the POS UX
    Route::get('api/products/search', [ProductSearchController::class, 'search'])
         ->name('api.products.search');
});
```

---

## Form Submission Pattern (`Inertia useForm`)
1. Extrapolate standard `useForm` originating from `@inertiajs/react`, utilizing an interface for type safety (`useForm<CustomerForm>`).
2. Establish an `onSubmit()` listener which triggers `e.preventDefault()`.
3. Dispatch request via the generic `post()`, `put()`, routing.
4. Establish quality of life hooks contextually (`preserveScroll: true` and `onSuccess: () => reset()`).
5. Render localized errors directly contextual to input fields wrapping `warnings` in `<InputError message={errors.field} />`.

---

## Frontend Page Patterns
Typical implementation logic within Inertia form construction leveraging Shadcn primitives seamlessly.
```tsx
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';

type CustomerForm = {
    name: string;
    email: string;
};

export default function CustomerCreate() {
    const { data, setData, post, reset, errors, processing } = useForm<CustomerForm>({
        name: '',
        email: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('customers.store'), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Customers', href: route('customers.index') }, { title: 'Create', href: '#' }]}>
            <Head title="Create Customer" />
            
            <form onSubmit={submit} className="space-y-6">
                <div>
                    <Label htmlFor="name">Customer Name*</Label>
                    <Input 
                         id="name" 
                         value={data.name} 
                         onChange={e => setData('name', e.target.value)} 
                         required 
                    />
                    <InputError message={errors.name} className="mt-2" />
                </div>
                
                <Button type="submit" disabled={processing}>Save</Button>
            </form>
        </AppLayout>
    );
}
```

## UI Components Used
- **Shadcn/ui (Radix UI)** primarily dictate layouts (`Button`, `Input`, `Switch`, `Textarea`, `Tabs`, `Dialog`). Generally placed under `resources/js/components/ui`.
- **SmartSelect**: Custom domain-driven elements (`smart-select.tsx`) sit logically under `resources/js/components/inputs/`, catering distinct behaviors like Ajax remote searches or complex relation handling natively integrated with the `useForm` parameters.
