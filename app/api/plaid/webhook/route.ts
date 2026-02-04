
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    // Basic scaffold for webhook handling
    // TODO: Verify webhook signature in production

    try {
        const body = await request.json();
        const { webhook_type, webhook_code, item_id } = body;

        console.log(`Received Plaid webhook: ${webhook_type} - ${webhook_code} for item ${item_id}`);

        if (webhook_type === 'TRANSACTIONS') {
            if (webhook_code === 'SYNC_UPDATES_AVAILABLE' || webhook_code === 'DEFAULT_UPDATE') {
                // Determine which user owns this item_id and flag for sync
                // For now, we just log it. A background job or the user triggering refresh will pick it up.
                // Optionally: Trigger the sync logic directly here (but keep it fast)
                console.log('New transactions available. Flagging for sync.');
            }
        }

        if (webhook_type === 'ITEM' && webhook_code === 'ERROR') {
            console.log('Item error detected.');
            // Update connection status to error in DB
        }

        return NextResponse.json({ received: true });
    } catch (e) {
        console.error('Webhook error:', e);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
