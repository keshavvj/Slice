'use client';

import * as React from 'react';
import { useStore } from '@/lib/store';

export function StoreHydration() {
    React.useEffect(() => {
        useStore.persist.rehydrate();
    }, []);

    return null;
}
