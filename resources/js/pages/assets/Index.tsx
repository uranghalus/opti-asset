import { usePage } from '@inertiajs/react';

import Browse from './Browse';
import type { PageProps } from './components/types';

export default function AssetsIndex() {
    const pageProps = usePage<PageProps>().props;

    return <Browse pageProps={pageProps} />;
}
