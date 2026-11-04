import { SearchIcon } from 'lucide-react';
import { useState } from 'react';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface SearchType {
    href: string;
    title: string;
}

const SearchLinks: SearchType[] = [
    {
        title: 'Modern',
        href: '/',
    },
    {
        title: 'eCommerce',
        href: '/dashboards/eCommerce',
    },
    {
        title: 'General',
        href: '/dashboards/general',
    },
    {
        title: 'Music',
        href: '/dashboards/music',
    },
    {
        title: 'General',
        href: '/dashboards/general',
    },
];

interface SearchProps {
    links?: SearchType[];
}

const Search = ({ links }: SearchProps) => {
    const [openModal, setOpenModal] = useState(false);
    const items = links ?? SearchLinks;

    return (
        <Dialog open={openModal} onOpenChange={setOpenModal}>
            <DialogTrigger asChild>
                <button className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-accent sm:w-auto sm:min-w-48 sm:justify-start sm:gap-2 sm:rounded-md sm:border sm:border-border sm:px-4 sm:py-1.5 sm:hover:bg-transparent">
                    <SearchIcon
                        size={16}
                        className="shrink-0 text-muted-foreground"
                    />
                    <span className="hidden text-sm font-normal text-muted-foreground sm:block">
                        Type to search...
                    </span>
                </button>
            </DialogTrigger>
            <DialogContent className="w-full max-w-2xl gap-0 p-0 sm:max-w-2xl [&>button]:hidden">
                <DialogTitle className="sr-only">Search</DialogTitle>
                <div className="border-b border-border p-6">
                    <Input
                        placeholder="Search links..."
                        className="flex-1 rounded-md pl-4 focus-visible:shadow-none focus-visible:ring-0"
                    />
                </div>

                <div className="flex-1 overflow-auto pt-0">
                    <SimpleBar className="max-h-72 px-6">
                        <h5 className="pt-5 text-lg font-medium">
                            Quick Page Links
                        </h5>
                        {items.length > 0 ? (
                            items.map((link, index) => (
                                <a
                                    href={link.href}
                                    className="group relative px-3 py-1"
                                    key={index}
                                >
                                    <h6 className="mb-1 text-sm font-medium group-hover:text-primary">
                                        {link.title}
                                    </h6>
                                    <p className="text-xs font-medium text-muted-foreground">
                                        {link.href}
                                    </p>
                                </a>
                            ))
                        ) : (
                            <p className="py-4 text-center text-sm text-muted-foreground">
                                No results found.
                            </p>
                        )}
                    </SimpleBar>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default Search;
