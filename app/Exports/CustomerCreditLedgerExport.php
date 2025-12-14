<?php

namespace App\Exports;

use App\Models\Customer;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class CustomerCreditLedgerExport implements FromCollection, ShouldAutoSize, WithHeadings, WithStyles, WithTitle
{
    protected Customer $customer;

    protected Collection $ledger;

    public function __construct(Customer $customer, $ledger)
    {
        $this->customer = $customer;
        $this->ledger = $ledger;
    }

    public function collection(): Collection
    {
        return $this->ledger->map(function ($entry) {
            return [
                'date' => $entry->transaction_date?->format('Y-m-d') ?? $entry->transaction_date,
                'type' => ucfirst($entry->transaction_type),
                'reference' => $entry->reference_no ?? '-',
                'branch' => $entry->branch?->name ?? '-',
                'debit' => (float) ($entry->debit ?? 0),
                'credit' => (float) ($entry->credit ?? 0),
                'balance' => (float) ($entry->balance ?? 0),
                'description' => $entry->description ?? '-',
            ];
        });
    }

    public function headings(): array
    {
        return [
            'Date',
            'Type',
            'Reference',
            'Branch',
            'Debit',
            'Credit',
            'Balance',
            'Description',
        ];
    }

    public function title(): string
    {
        return 'Credit Ledger';
    }

    public function styles(Worksheet $sheet): array
    {
        // Make header row bold
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
