import { useReveal } from '@/hooks/use-reveal';

const activities = [
    {
        time: '10:45 AM',
        text: 'MacBook Pro M3 assigned to Budi Santoso',
        dept: 'IT',
        color: '#006FCF',
    },
    {
        time: '09:30 AM',
        text: 'HP LaserJet scheduled for maintenance',
        dept: 'Admin',
        color: '#B95000',
    },
    {
        time: '08:15 AM',
        text: 'ThinkPad X1 Carbon added to inventory',
        dept: 'Procurement',
        color: '#00875A',
    },
    {
        time: 'Yesterday',
        text: 'Dell Monitor returned by Siti Rahayu',
        dept: 'Finance',
        color: '#86888C',
    },
];

export function ActivityTimeline() {
    const ref = useReveal();

    return (
        <div ref={ref} className="reveal delay-400">
            <div className="bezel-outer">
                <div className="bezel-inner p-6">
                    <p className="mb-1.5 text-[10px] font-semibold tracking-[0.2em] text-primary uppercase">
                        Live
                    </p>
                    <h3 className="mb-5 text-lg font-semibold tracking-tight">
                        Recent Activity
                    </h3>

                    <div className="flex flex-col gap-0">
                        {activities.map((a, i) => (
                            <div
                                key={`${a.time}-${i}`}
                                className="relative flex gap-3 pb-4 last:pb-0"
                            >
                                <div className="relative flex flex-col items-center">
                                    <span
                                        className="size-2.5 shrink-0 rounded-full"
                                        style={{ backgroundColor: a.color }}
                                    />
                                    {i < activities.length - 1 && (
                                        <span className="mt-1 w-px flex-1 bg-border" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1 pt-0.5">
                                    <p className="text-[11px] text-muted-foreground">
                                        {a.time}
                                    </p>
                                    <p className="mt-0.5 text-sm leading-snug">
                                        {a.text}
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                                        {a.dept}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
