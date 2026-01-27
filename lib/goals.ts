import { SharedGoal, Friend } from '@/types';
import { addWeeks, addMonths, isAfter, isSameDay, parseISO } from 'date-fns';

export function computeNextRunDate(
    frequency: "weekly" | "biweekly" | "monthly",
    fromDate: Date | string
): Date {
    const date = typeof fromDate === 'string' ? parseISO(fromDate) : fromDate;
    switch (frequency) {
        case 'weekly':
            return addWeeks(date, 1);
        case 'biweekly':
            return addWeeks(date, 2);
        case 'monthly':
            return addMonths(date, 1);
        default:
            return addWeeks(date, 1);
    }
}

export interface MemberContribution {
    memberId: string;
    name: string;
    avatarInitials: string;
    amount: number;
    percent: number;
    isCurrentUser: boolean;
}

export function getMemberBreakdown(goal: SharedGoal, currentUserId: string): MemberContribution[] {
    const total = goal.currentAmount;
    const map = new Map<string, number>();

    // Initialize all members with 0
    goal.members.forEach(m => map.set(m.id, 0));
    // Ensure current user is tracked even if not explicitly in members list (should be there though)
    if (!map.has(currentUserId)) map.set(currentUserId, 0);

    // Sum contributions
    goal.contributions.forEach(c => {
        const current = map.get(c.memberId) || 0;
        map.set(c.memberId, current + c.amount);
    });

    // Convert to array
    const result: MemberContribution[] = [];

    // Process members from the map (includes members who might have left but contributed, if handled that way)
    // For now, iterate known members + current user

    const allMemberIds = Array.from(new Set([...goal.members.map(m => m.id), currentUserId]));

    allMemberIds.forEach(id => {
        const amount = map.get(id) || 0;
        const percent = total > 0 ? (amount / total) * 100 : 0;

        // Find member details
        const member = goal.members.find(m => m.id === id);
        const isCurrentUser = id === currentUserId;

        let name = "Unknown";
        let initials = "??";

        if (isCurrentUser) {
            name = "You";
            initials = "ME";
        } else if (member) {
            name = member.name;
            initials = member.avatarInitials;
        }

        result.push({
            memberId: id,
            name,
            avatarInitials: initials,
            amount,
            percent: Math.round(percent),
            isCurrentUser
        });
    });

    return result.sort((a, b) => b.amount - a.amount);
}
