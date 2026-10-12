import type { CatalogOrder, Contact, Message } from "@/types/whatsapp";

/** Latest ISO timestamp, or null when none of the values are set. */
export function latestIsoTimestamp(
  values: Iterable<string | null | undefined>
): string | null {
  let latest: string | null = null;
  for (const value of values) {
    if (!value) continue;
    if (latest === null || value > latest) latest = value;
  }
  return latest;
}

/**
 * Append messages the client has not seen yet.
 * Returns the same object when nothing new arrived so React can skip the render.
 */
export function mergeIncomingMessages(
  prev: Record<string, Message[]>,
  incoming: Record<string, Message[]>
): Record<string, Message[]> {
  let changed = false;
  const next: Record<string, Message[]> = { ...prev };

  for (const [contactId, incomingList] of Object.entries(incoming)) {
    if (!incomingList?.length) continue;
    const current = prev[contactId] || [];
    const seen = new Set(current.map((message) => message.id));
    const fresh = incomingList.filter((message) => !seen.has(message.id));
    if (!fresh.length) continue;
    next[contactId] = [...current, ...fresh];
    changed = true;
  }

  return changed ? next : prev;
}

/** Insert or patch contacts from an incremental `updated_at` poll. */
export function mergeIncomingContacts(prev: Contact[], incoming: Contact[]): Contact[] {
  if (!incoming.length) return prev;

  let changed = false;
  const next = prev.slice();

  for (const contact of incoming) {
    const index = next.findIndex((item) => item.id === contact.id);
    if (index === -1) {
      next.unshift(contact);
      changed = true;
      continue;
    }

    const current = next[index];
    if (
      current.updatedAt !== contact.updatedAt ||
      current.lastMessageSnippet !== contact.lastMessageSnippet ||
      current.lastMessageTime !== contact.lastMessageTime ||
      current.unreadCount !== contact.unreadCount ||
      current.status !== contact.status ||
      current.assignedAgent !== contact.assignedAgent ||
      current.isBotActive !== contact.isBotActive ||
      current.name !== contact.name
    ) {
      next[index] = contact;
      changed = true;
    }
  }

  return changed ? next : prev;
}

/**
 * Drop rows the server no longer has.
 * Returns the same array when every local id is still present.
 */
export function withoutRemovedIds<T extends { id: string }>(
  prev: T[],
  ids: readonly string[]
): T[] {
  const allowed = new Set(ids);
  if (allowed.size === prev.length && prev.every((item) => allowed.has(item.id))) return prev;
  const next = prev.filter((item) => allowed.has(item.id));
  return next.length === prev.length ? prev : next;
}

/** Insert or patch catalog orders from an incremental `updated_at` poll. */
export function mergeIncomingOrders(
  prev: CatalogOrder[],
  incoming: CatalogOrder[]
): CatalogOrder[] {
  if (!incoming.length) return prev;

  let changed = false;
  const next = prev.slice();

  for (const order of incoming) {
    const index = next.findIndex((item) => item.id === order.id);
    if (index === -1) {
      next.unshift(order);
      changed = true;
      continue;
    }

    const current = next[index];
    if (
      current.updatedAt !== order.updatedAt ||
      current.status !== order.status ||
      current.trackingNumber !== order.trackingNumber ||
      current.shippingAddress !== order.shippingAddress ||
      current.subtotal !== order.subtotal
    ) {
      next[index] = order;
      changed = true;
    }
  }

  return changed ? next : prev;
}
