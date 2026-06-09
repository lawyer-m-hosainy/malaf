-- Migration: 033_reconciliation_and_paymob.sql

-- Add missing columns to payment_transactions to support Paymob callbacks and invoices
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payment_transactions' AND column_name='gateway') THEN
        ALTER TABLE public.payment_transactions ADD COLUMN gateway TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payment_transactions' AND column_name='currency') THEN
        ALTER TABLE public.payment_transactions ADD COLUMN currency TEXT DEFAULT 'EGP';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payment_transactions' AND column_name='payer_phone') THEN
        ALTER TABLE public.payment_transactions ADD COLUMN payer_phone TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payment_transactions' AND column_name='payer_name') THEN
        ALTER TABLE public.payment_transactions ADD COLUMN payer_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payment_transactions' AND column_name='metadata') THEN
        ALTER TABLE public.payment_transactions ADD COLUMN metadata JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payment_transactions' AND column_name='gateway_transaction_id') THEN
        ALTER TABLE public.payment_transactions ADD COLUMN gateway_transaction_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payment_transactions' AND column_name='payment_method') THEN
        ALTER TABLE public.payment_transactions ADD COLUMN payment_method TEXT;
    END IF;
END $$;
