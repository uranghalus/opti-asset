const data = [
    { label: 'Active', count: 1089, pct: 87.3, color: '#00875A' },
    { label: 'Maintenance', count: 67, pct: 5.4, color: '#B95000' },
    { label: 'Idle', count: 52, pct: 4.2, color: '#86888C' },
    { label: 'Disposed', count: 40, pct: 3.2, color: '#C52720' },
];

export function StatusBreakdown() {
    return (
        <div className="flex flex-col gap-3">
            {data.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                    <span className="w-20 text-xs text-muted-foreground">
                        {item.label}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-border/50">
                        <div
                            className="h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                            style={{
                                width: `${item.pct}%`,
                                backgroundColor: item.color,
                            }}
                        />
                    </div>
                    <span className="w-12 text-right text-xs font-semibold tabular-nums">
                        {item.count}
                    </span>
                </div>
            ))}
        </div>
    );
}
