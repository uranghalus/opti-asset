import { Badge } from '@/components/ui/badge';

export function NavSecondary() {
    return (
        <div className="-mx-4 border-t border-border px-5 py-5">
            <Badge variant="secondary" className="text-xs">
                v1.0.0
            </Badge>
        </div>
    );
}
