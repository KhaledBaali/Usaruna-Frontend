import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createProducerProfile, placeOrder } from './api';

// Mock the Supabase client — no real network calls in unit tests
vi.mock('../supabase', () => ({
  supabase: { rpc: vi.fn() },
}));

import { supabase } from '../supabase';

// ─── createProducerProfile ────────────────────────────────────────────────────

describe('createProducerProfile', () => {
  beforeEach(() => vi.clearAllMocks());

  const BASE = {
    userId:     'user-uuid-123',
    nameAr:     'عائلة الأحمد',
    cityId:     1,
    categoryId: 2,
    email:      'test@example.com',
  };

  it('calls rpc with correct parameters', async () => {
    supabase.rpc.mockResolvedValue({ data: null, error: null });

    await createProducerProfile(BASE);

    expect(supabase.rpc).toHaveBeenCalledWith('create_producer_profile', {
      p_user_id:     'user-uuid-123',
      p_name_ar:     'عائلة الأحمد',
      p_city_id:     1,
      p_category_id: 2,
      p_desc_ar:     null,
      p_email:       'test@example.com',
      p_phone:       null,
    });
  });

  it('returns { ok: true } on success', async () => {
    supabase.rpc.mockResolvedValue({ data: null, error: null });

    const result = await createProducerProfile(BASE);

    expect(result).toEqual({ ok: true });
  });

  it('passes optional descAr and phone when provided', async () => {
    supabase.rpc.mockResolvedValue({ data: null, error: null });

    await createProducerProfile({ ...BASE, descAr: 'نبذة عن العائلة', phone: '0501234567' });

    expect(supabase.rpc).toHaveBeenCalledWith('create_producer_profile', expect.objectContaining({
      p_desc_ar: 'نبذة عن العائلة',
      p_phone:   '0501234567',
    }));
  });

  it('defaults descAr and phone to null when omitted', async () => {
    supabase.rpc.mockResolvedValue({ data: null, error: null });

    await createProducerProfile(BASE);

    expect(supabase.rpc).toHaveBeenCalledWith('create_producer_profile', expect.objectContaining({
      p_desc_ar: null,
      p_phone:   null,
    }));
  });

  it('throws when rpc returns an error', async () => {
    const err = { message: 'column "name_ar" does not exist' };
    supabase.rpc.mockResolvedValue({ data: null, error: err });

    await expect(createProducerProfile(BASE)).rejects.toMatchObject({ message: err.message });
  });

  it('throws the exact error object from Supabase', async () => {
    const err = { message: 'ON CONFLICT error', code: '42P10' };
    supabase.rpc.mockResolvedValue({ data: null, error: err });

    await expect(createProducerProfile(BASE)).rejects.toBe(err);
  });
});

// ─── placeOrder ───────────────────────────────────────────────────────────────

describe('placeOrder', () => {
  beforeEach(() => vi.clearAllMocks());

  const ITEMS = [
    { product_id: 'prod-1', name_ar: 'تمر', name_en: 'Dates', price: 50, qty: 2,
      emoji: '🌴', gradient: 'from-amber-50', delivery_option: 'seller_delivery', delivery_price: 0 },
  ];

  const BASE_ORDER = {
    userId:        'user-uuid-456',
    orderNumber:   '847291',
    total:         100,
    deliveryTotal: 0,
    payMethod:     'cod',
    items:         ITEMS,
  };

  it('calls rpc with correct parameters', async () => {
    supabase.rpc.mockResolvedValue({ data: { order_id: 'ord-1', order_number: '847291', status: 'confirmed' }, error: null });

    await placeOrder(BASE_ORDER);

    expect(supabase.rpc).toHaveBeenCalledWith('place_order', {
      p_user_id:        'user-uuid-456',
      p_order_number:   '847291',
      p_total:          100,
      p_delivery_total: 0,
      p_pay_method:     'cod',
      p_items:          ITEMS,
    });
  });

  it('returns the order data on success', async () => {
    const orderData = { order_id: 'ord-uuid-1', order_number: '847291', status: 'confirmed' };
    supabase.rpc.mockResolvedValue({ data: orderData, error: null });

    const result = await placeOrder(BASE_ORDER);

    expect(result).toEqual(orderData);
  });

  it('throws when rpc returns an error', async () => {
    const err = { message: 'OUT_OF_STOCK: product "تمر" has only 1 units left (requested 2)' };
    supabase.rpc.mockResolvedValue({ data: null, error: err });

    await expect(placeOrder(BASE_ORDER)).rejects.toMatchObject({ message: err.message });
  });

  it('throws on empty cart error', async () => {
    const err = { message: 'EMPTY_CART: no items provided' };
    supabase.rpc.mockResolvedValue({ data: null, error: err });

    await expect(placeOrder({ ...BASE_ORDER, items: [] })).rejects.toMatchObject({ message: err.message });
  });

  it('throws on unauthorized error', async () => {
    const err = { message: 'UNAUTHORIZED: caller uid does not match p_user_id', code: '42501' };
    supabase.rpc.mockResolvedValue({ data: null, error: err });

    await expect(placeOrder(BASE_ORDER)).rejects.toMatchObject({ code: '42501' });
  });

  it('passes multiple items correctly', async () => {
    const multiItems = [
      ...ITEMS,
      { product_id: 'prod-2', name_ar: 'عسل', name_en: 'Honey', price: 80, qty: 1,
        emoji: '🍯', gradient: 'from-yellow-50', delivery_option: 'third_party', delivery_price: 15 },
    ];
    supabase.rpc.mockResolvedValue({ data: { order_id: 'ord-2', order_number: '999', status: 'confirmed' }, error: null });

    await placeOrder({ ...BASE_ORDER, items: multiItems });

    expect(supabase.rpc).toHaveBeenCalledWith('place_order', expect.objectContaining({
      p_items: multiItems,
    }));
  });
});
