import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const data = [
    { name: 'Electronics', value: 485, color: '#006FCF' },
    { name: 'Furniture', value: 210, color: '#00875A' },
    { name: 'Vehicles', value: 78, color: '#B95000' },
    { name: 'Equipment', value: 195, color: '#BF9B30' },
    { name: 'Software', value: 280, color: '#00175A' },
];

export function CategoryChart() {
    return (
        <div className="flex items-center gap-5">
            <div className="relative size-32 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={36}
                            outerRadius={52}
                            dataKey="value"
                            startAngle={90}
                            endAngle={-270}
                            strokeWidth={0}
                        >
                            {data.map((entry) => (
                                <Cell key={entry.name} fill={entry.color} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold">5</span>
                    <span className="text-[10px] text-muted-foreground">
                        Types
                    </span>
                </div>
            </div>
            <div className="flex flex-1 flex-col gap-2 text-sm">
                {data.map((item) => (
                    <div
                        key={item.name}
                        className="flex items-center justify-between"
                    >
                        <span className="flex items-center gap-2">
                            <span
                                className="size-2 rounded-full"
                                style={{ backgroundColor: item.color }}
                            />
                            {item.name}
                        </span>
                        <span className="font-semibold tabular-nums">
                            {item.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
