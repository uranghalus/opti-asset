import { useReveal } from '@/hooks/use-reveal';

const movements = [
    {
        asset: 'MacBook Pro M3',
        type: 'Assigned',
        person: 'Budi Santoso',
        dept: 'IT',
        date: '21 Jul',
        color: '#006FCF',
    },
    {
        asset: 'Dell Monitor 27"',
        type: 'Returned',
        person: 'Siti Rahayu',
        dept: 'Finance',
        date: '21 Jul',
        color: '#00875A',
    },
    {
        asset: 'HP LaserJet Pro',
        type: 'Maintenance',
        person: 'Ahmad Fauzi',
        dept: 'Admin',
        date: '20 Jul',
        color: '#B95000',
    },
    {
        asset: 'ThinkPad X1 Carbon',
        type: 'Assigned',
        person: 'Dewi Lestari',
        dept: 'Marketing',
        date: '20 Jul',
        color: '#006FCF',
    },
    {
        asset: 'Old Desktop PC',
        type: 'Disposed',
        person: 'Rizki Pratama',
        dept: 'HR',
        date: '19 Jul',
        color: '#C52720',
    },
];

export function AssetMovementsTable() {
    const ref = useReveal();

    return (
        <div ref={ref} className="reveal delay-400">
            <div className="bezel-outer">
                <div className="bezel-inner p-6">
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <p className="mb-1.5 text-[10px] font-semibold tracking-[0.2em] text-primary uppercase">
                                Operations
                            </p>
                            <h3 className="text-lg font-semibold tracking-tight">
                                Recent Movements
                            </h3>
                        </div>
                        <span className="rounded-full bg-primary/8 px-3 py-1 text-[11px] font-medium text-primary">
                            Last 7 days
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/50 text-left text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                                    <th className="pr-4 pb-3">Asset</th>
                                    <th className="pr-4 pb-3">Type</th>
                                    <th className="hidden pr-4 pb-3 sm:table-cell">
                                        Person
                                    </th>
                                    <th className="hidden pr-4 pb-3 md:table-cell">
                                        Dept
                                    </th>
                                    <th className="pb-3 text-right">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {movements.map((m) => (
                                    <tr
                                        key={`${m.asset}-${m.date}`}
                                        className="border-b border-border/30 last:border-0"
                                    >
                                        <td className="py-3 pr-4 font-medium">
                                            {m.asset}
                                        </td>
                                        <td className="py-3 pr-4">
                                            <span
                                                className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                                                style={{
                                                    backgroundColor: `${m.color}15`,
                                                    color: m.color,
                                                }}
                                            >
                                                {m.type}
                                            </span>
                                        </td>
                                        <td className="hidden py-3 pr-4 text-muted-foreground sm:table-cell">
                                            {m.person}
                                        </td>
                                        <td className="hidden py-3 pr-4 text-muted-foreground md:table-cell">
                                            {m.dept}
                                        </td>
                                        <td className="py-3 text-right text-xs text-muted-foreground">
                                            {m.date}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
