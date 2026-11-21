@php
    /** @var array<int, array<int, string>> $rows */
    /** @var array<int, array{label: string, align: string}> $columnMeta */
    /** @var array<string, string> $filterSummary */
@endphp
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Laporan Daftar Aset</title>
    <style>
        @page {
            size: A4 {{ $orientation }};
            margin: 12mm;
        }

        body {
            font-family: DejaVu Sans, system-ui, -apple-system, sans-serif;
            font-size: 7pt;
            color: #111;
            margin: 0;
        }

        h1 {
            font-size: 13pt;
            margin: 0 0 2mm;
        }

        .meta {
            font-size: 7pt;
            color: #555;
            margin-bottom: 2mm;
        }

        .filters {
            font-size: 6.5pt;
            color: #333;
            margin-bottom: 3mm;
            line-height: 1.5;
        }

        .filters span {
            display: inline-block;
            margin-right: 4mm;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        thead th {
            background-color: #f3f4f6;
            border: 0.4pt solid #d1d5db;
            padding: 2mm 1.5mm;
            text-align: left;
            font-size: 6.5pt;
            text-transform: uppercase;
            letter-spacing: 0.02em;
            color: #4b5563;
        }

        tbody td {
            border: 0.4pt solid #e5e7eb;
            padding: 1.6mm 1.5mm;
            vertical-align: top;
            font-size: 6.8pt;
        }

        tbody tr:nth-child(even) td {
            background-color: #fafafa;
        }

        .text-right { text-align: right; }
        .text-center { text-align: center; }

        .empty {
            text-align: center;
            color: #6b7280;
            padding: 6mm;
        }
    </style>
</head>
<body>
    <h1>Laporan Daftar Aset</h1>

    <div class="meta">
        Dicetak {{ $printedAt->format('d/m/Y H:i') }} &middot; Total {{ number_format($total, 0, ',', '.') }} aset
    </div>

    @if (! empty($filterSummary))
        <div class="filters">
            @foreach ($filterSummary as $label => $value)
                <span><strong>{{ $label }}:</strong> {{ $value }}</span>
            @endforeach
        </div>
    @endif

    <table>
        <thead>
            <tr>
                @foreach ($columnMeta as $meta)
                    <th class="text-{{ $meta['align'] }}">{{ $meta['label'] }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @forelse ($rows as $row)
                <tr>
                    @foreach ($row as $index => $value)
                        <td class="text-{{ $columnMeta[$index]['align'] }}">{{ $value }}</td>
                    @endforeach
                </tr>
            @empty
                <tr>
                    <td class="empty" colspan="{{ count($columnMeta) }}">Tidak ada data</td>
                </tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
