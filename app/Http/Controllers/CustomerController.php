<?php

namespace App\Http\Controllers;

use App\Http\Requests\CustomerStoreRequest;
use App\Http\Requests\CustomerUpdateRequest;
use App\Models\Customer;
use App\Models\CustomerCreditLedger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class CustomerController extends Controller
{
    public function index(Request $request): Response
    {
        $customers = QueryBuilder::for(Customer::class)
            ->allowedFilters([
                'code',
                'name',
                'phone',
                AllowedFilter::exact('is_active'),
            ])
            ->allowedSorts(['code', 'name', 'phone', 'current_balance', 'credit_limit', 'created_at'])
            ->defaultSort('name')
            ->paginate($request->input('per_page', 25))
            ->withQueryString();

        return Inertia::render('Customer/index', [
            'customers' => $customers,
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('Customer/create');
    }

    public function store(CustomerStoreRequest $request): RedirectResponse
    {
        $customer = Customer::create($request->validated());

        $request->session()->flash('customer.id', $customer->id);

        return redirect()->route('customers.index');
    }

    public function show(Request $request, Customer $customer): Response
    {
        // Load credit ledger entries for this customer
        $creditLedger = CustomerCreditLedger::with(['branch'])
            ->where('customer_id', $customer->id)
            ->orderBy('transaction_date', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        return Inertia::render('Customer/show', [
            'customer' => $customer,
            'creditLedger' => $creditLedger,
        ]);
    }

    public function edit(Request $request, Customer $customer): Response
    {
        return Inertia::render('Customer/edit', [
            'customer' => $customer,
        ]);
    }

    public function update(CustomerUpdateRequest $request, Customer $customer): RedirectResponse
    {
        $customer->update($request->validated());

        $request->session()->flash('customer.id', $customer->id);

        return redirect()->route('customers.index');
    }

    public function destroy(Request $request, Customer $customer): RedirectResponse
    {
        $customer->delete();

        return redirect()->route('customers.index');
    }

    /**
     * Export customer credit ledger to CSV or Excel
     */
    public function exportCreditLedger(Request $request, Customer $customer): StreamedResponse|\Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $format = $request->query('format', 'csv');

        $ledger = CustomerCreditLedger::with(['branch'])
            ->where('customer_id', $customer->id)
            ->orderBy('transaction_date', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        if ($format === 'excel') {
            return $this->exportCreditLedgerExcel($customer, $ledger);
        }

        return $this->exportCreditLedgerCsv($customer, $ledger);
    }

    /**
     * Export credit ledger to CSV format
     */
    private function exportCreditLedgerCsv(Customer $customer, $ledger): StreamedResponse
    {
        $customerSlug = str(strtolower($customer->name.'_'.$customer->code))->snake();
        $fileName = "credit_ledger_{$customerSlug}_".now()->format('Y-m-d_His').'.csv';

        return response()->streamDownload(function () use ($customer, $ledger) {
            $handle = fopen('php://output', 'w');

            // Header
            fputcsv($handle, ['Credit Ledger for: '.$customer->name.' ('.$customer->code.')']);
            fputcsv($handle, ['Exported on: '.now()->format('Y-m-d H:i:s')]);
            fputcsv($handle, []);

            // Column headers
            fputcsv($handle, [
                'Date',
                'Type',
                'Reference',
                'Branch',
                'Debit',
                'Credit',
                'Balance',
                'Description',
            ]);

            // Data rows
            foreach ($ledger as $entry) {
                fputcsv($handle, [
                    $entry->transaction_date,
                    ucfirst($entry->transaction_type),
                    $entry->reference_no ?? '-',
                    $entry->branch?->name ?? '-',
                    number_format((float) ($entry->debit ?? 0), 2),
                    number_format((float) ($entry->credit ?? 0), 2),
                    number_format((float) ($entry->balance ?? 0), 2),
                    $entry->description ?? '-',
                ]);
            }

            // Summary
            fputcsv($handle, []);
            fputcsv($handle, ['Current Balance:', '', '', '', '', '', number_format((float) ($customer->current_balance ?? 0), 2).' Ks']);

            fclose($handle);
        }, $fileName, [
            'Content-Type' => 'text/csv',
        ]);
    }

    /**
     * Export credit ledger to Excel format
     */
    private function exportCreditLedgerExcel(Customer $customer, $ledger): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $customerSlug = str(strtolower($customer->name.'_'.$customer->code))->snake();
        $fileName = "credit_ledger_{$customerSlug}_".now()->format('Y-m-d_His').'.xlsx';

        return \Maatwebsite\Excel\Facades\Excel::download(
            new \App\Exports\CustomerCreditLedgerExport($customer, $ledger),
            $fileName
        );
    }
}
