'use client';

import * as React from 'react';
import { useStore } from '@/lib/store';

export function StoreHydration() {
    React.useEffect(() => {
        useStore.persist.rehydrate();
        useStore.getState().fetchIdentity(); // Fetch real user data
    }, []);

    return null;
}
