import {
  NewsletterCampaign,
  NewsletterCampaignsResponse,
  NewsletterSubscriber,
  NewsletterSubscriberStatus,
  NewsletterSubscribersListResponse,
} from '../models/ecommerce-newsletter.model';

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function readOptionalString(value: unknown): string | null {
  if (value == null) return null;
  const str = String(value).trim();
  return str || null;
}

function readNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readSubscriberStatus(value: unknown): NewsletterSubscriberStatus {
  return readString(value) === 'unsubscribed' ? 'unsubscribed' : 'active';
}

function adaptSubscriberCustomer(raw: unknown): NewsletterSubscriber['customer'] {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const data = raw as Record<string, unknown>;

  return {
    id: readString(data['id']),
    name: readString(data['name']),
  };
}

export function adaptNewsletterSubscriber(raw: unknown): NewsletterSubscriber {
  const data = (raw ?? {}) as Record<string, unknown>;

  return {
    id: readString(data['id']),
    email: readString(data['email']),
    status: readSubscriberStatus(data['status']),
    source: readString(data['source']),
    subscribedAt: readString(data['subscribedAt']),
    unsubscribedAt: readOptionalString(data['unsubscribedAt']),
    customerId: readOptionalString(data['customerId']),
    customer: adaptSubscriberCustomer(data['customer']),
  };
}

export function adaptNewsletterSubscribersListResponse(
  raw: unknown,
): NewsletterSubscribersListResponse {
  const data = (raw ?? {}) as Record<string, unknown>;
  const subscribers = Array.isArray(data['subscribers'])
    ? data['subscribers'].map(adaptNewsletterSubscriber)
    : [];
  const meta = (data['meta'] ?? {}) as Record<string, unknown>;
  const total = readNumber(meta['total'], subscribers.length);
  const perPage = readNumber(meta['perPage'], 15);

  return {
    subscribers,
    meta: {
      total,
      page: readNumber(meta['page'], 1),
      perPage,
      totalPages: readNumber(meta['totalPages'], Math.max(1, Math.ceil(total / perPage))),
      activeCount: readNumber(meta['activeCount'], subscribers.length),
    },
  };
}

export function adaptNewsletterCampaign(raw: unknown): NewsletterCampaign {
  const data = (raw ?? {}) as Record<string, unknown>;

  return {
    id: readString(data['id']),
    subject: readString(data['subject']),
    title: readString(data['title']),
    status: readString(data['status']),
    sentCount: readNumber(data['sentCount']),
    failedCount: readNumber(data['failedCount']),
    sentAt: readOptionalString(data['sentAt']),
    createdAt: readString(data['createdAt']),
  };
}

export function adaptNewsletterCampaignsResponse(raw: unknown): NewsletterCampaignsResponse {
  const data = (raw ?? {}) as Record<string, unknown>;
  const campaigns = Array.isArray(data['campaigns'])
    ? data['campaigns'].map(adaptNewsletterCampaign)
    : [];

  return { campaigns };
}

export function adaptSendNewsletterCampaignResponse(raw: unknown): {
  success: boolean;
  recipientCount: number;
  campaign: NewsletterCampaign;
} {
  const data = (raw ?? {}) as Record<string, unknown>;

  return {
    success: data['success'] === true,
    recipientCount: readNumber(data['recipientCount']),
    campaign: adaptNewsletterCampaign(data['campaign']),
  };
}

export function adaptNewsletterUnsubscribeResponse(raw: unknown): { success: boolean } {
  const data = (raw ?? {}) as Record<string, unknown>;

  return {
    success: data['success'] === true,
  };
}
