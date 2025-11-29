-- Tornar o campo address opcional na tabela clients
ALTER TABLE public.clients 
ALTER COLUMN address DROP NOT NULL;