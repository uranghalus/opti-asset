import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

const data = [
    { month: 'Jan', count: 42 },
    { month: 'Feb', count: 38 },
    { month: 'Mar', count: 55 },
    { month: 'Apr', count: 47 },
    { month: 'May', count: 63 },
    { month: 'Jun', count: 58 },
    { month: 'Jul', count: 52 },
    { month: 'Aug', count: 71 },
    { month: 'Sep', count: 65 },
    { month: 'Oct', count: 48 },
    { month: 'Nov', count: 78 },
    { month: 'Dec', count: 52 },
];

export function AcquisitionChart() {
    return (
        <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data}>
                <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#ECEDEE"
                />
                <XAxis
                    dataKey="month"
                    stroke="#86888C"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="#86888C"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                />
                <Tooltip />
                <Bar
                    dataKey="count"
                    fill="#006FCF"
                    radius={[6, 6, 0, 0]}
                    barSize={20}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}
