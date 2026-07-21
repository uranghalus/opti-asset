import { Head } from '@inertiajs/react';
import {
    Building2,
    CheckCircle,
    ClipboardList,
    DollarSign,
    Package,
    Wrench,
} from 'lucide-react';
import { AcquisitionChart } from '@/components/dashboard/acquisition-chart';
import { ActivityTimeline } from '@/components/dashboard/activity-timeline';
import { AssetMovementsTable } from '@/components/dashboard/asset-movements-table';
import { AssetSummaryCard } from '@/components/dashboard/asset-summary-card';
import { CategoryChart } from '@/components/dashboard/category-chart';
import { PremiumChartCard } from '@/components/dashboard/premium-chart-card';
import { PremiumStatCard } from '@/components/dashboard/premium-stat-card';
import { StatusBreakdown } from '@/components/dashboard/status-breakdown';
import { WelcomeBanner } from '@/components/dashboard/welcome-banner';
import { dashboard } from '@/routes';

export default function Dashboard() {
    return (
        <>
            <Head title="Dashboard" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
                {/* Welcome Banner */}
                <WelcomeBanner />

                {/* Stat Cards — 6-col bento */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    <PremiumStatCard
                        label="Total Assets"
                        value="1,248"
                        change="+52 this month"
                        icon={<Package className="size-5" />}
                        delay={100}
                    />
                    <PremiumStatCard
                        label="Active"
                        value="1,089"
                        change="87.3% utilization"
                        icon={<CheckCircle className="size-5" />}
                        delay={150}
                    />
                    <PremiumStatCard
                        label="Maintenance"
                        value="67"
                        change="+8 from last month"
                        changePositive={false}
                        icon={<Wrench className="size-5" />}
                        delay={200}
                    />
                    <PremiumStatCard
                        label="Total Value"
                        value="Rp 12.4B"
                        change="+Rp 850M this quarter"
                        icon={<DollarSign className="size-5" />}
                        delay={250}
                    />
                    <PremiumStatCard
                        label="Departments"
                        value="12"
                        change="All active"
                        icon={<Building2 className="size-5" />}
                        delay={300}
                    />
                    <PremiumStatCard
                        label="Requests"
                        value="38"
                        change="8 pending"
                        changePositive={false}
                        icon={<ClipboardList className="size-5" />}
                        delay={350}
                    />
                </div>

                {/* Asymmetric Bento Grid */}
                <div className="grid gap-5 lg:grid-cols-12">
                    {/* Left: Acquisition Chart — spans 8 cols */}
                    <div className="lg:col-span-8">
                        <PremiumChartCard
                            title="Asset Acquisition Trend"
                            eyebrow="Analytics"
                            delay={200}
                        >
                            <AcquisitionChart />
                        </PremiumChartCard>
                    </div>

                    {/* Right: Status Breakdown — spans 4 cols */}
                    <div className="lg:col-span-4">
                        <PremiumChartCard
                            title="Status Distribution"
                            eyebrow="Overview"
                            delay={300}
                        >
                            <StatusBreakdown />
                        </PremiumChartCard>
                    </div>

                    {/* Left: Category Chart — spans 5 cols */}
                    <div className="lg:col-span-5">
                        <PremiumChartCard
                            title="By Category"
                            eyebrow="Portfolio"
                            delay={300}
                        >
                            <CategoryChart />
                        </PremiumChartCard>
                    </div>

                    {/* Right: Asset Summary Card — spans 7 cols */}
                    <div className="lg:col-span-7">
                        <AssetSummaryCard />
                    </div>

                    {/* Full Width: Movements Table */}
                    <div className="lg:col-span-12">
                        <AssetMovementsTable />
                    </div>

                    {/* Right: Activity Timeline — spans 4 cols */}
                    <div className="lg:col-span-4">
                        <ActivityTimeline />
                    </div>

                    {/* Left: Quick Stats — spans 8 cols */}
                    <div className="lg:col-span-8">
                        <PremiumChartCard
                            title="Department Overview"
                            eyebrow="Distribution"
                            delay={400}
                        >
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                {[
                                    { name: 'IT', assets: 312, pct: '25%' },
                                    {
                                        name: 'Finance',
                                        assets: 198,
                                        pct: '15.9%',
                                    },
                                    {
                                        name: 'Marketing',
                                        assets: 156,
                                        pct: '12.5%',
                                    },
                                    {
                                        name: 'Operations',
                                        assets: 234,
                                        pct: '18.7%',
                                    },
                                    { name: 'HR', assets: 89, pct: '7.1%' },
                                    {
                                        name: 'Admin',
                                        assets: 145,
                                        pct: '11.6%',
                                    },
                                    { name: 'Legal', assets: 67, pct: '5.4%' },
                                    { name: 'Other', assets: 47, pct: '3.8%' },
                                ].map((d) => (
                                    <div
                                        key={d.name}
                                        className="rounded-xl bg-primary/5 p-4 text-center"
                                    >
                                        <p className="text-2xl font-bold tracking-tight">
                                            {d.assets}
                                        </p>
                                        <p className="mt-1 text-xs font-medium text-muted-foreground">
                                            {d.name}
                                        </p>
                                        <p className="text-[11px] text-primary">
                                            {d.pct}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </PremiumChartCard>
                    </div>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
