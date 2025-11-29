-- Add new columns to clients table
ALTER TABLE public.clients
ADD COLUMN person_type text CHECK (person_type IN ('Física', 'Jurídica')),
ADD COLUMN city text,
ADD COLUMN state text,
ADD COLUMN document text, -- CPF/CNPJ
ADD COLUMN salesperson text,
ADD COLUMN birth_date date,
ADD COLUMN business_sector text, -- ramo
ADD COLUMN monthly_income numeric,
ADD COLUMN license_expiry date, -- vencimento CNH
ADD COLUMN is_active boolean DEFAULT true,
ADD COLUMN marital_status text,
ADD COLUMN related_clients jsonb, -- array of {clientId, relationship}
ADD COLUMN profession text,
ADD COLUMN gender text CHECK (gender IN ('Masculino', 'Feminino', 'Outro', 'Prefiro não informar'));

-- Add indexes for better query performance
CREATE INDEX idx_clients_person_type ON public.clients(person_type);
CREATE INDEX idx_clients_salesperson ON public.clients(salesperson);
CREATE INDEX idx_clients_is_active ON public.clients(is_active);
CREATE INDEX idx_clients_city ON public.clients(city);
CREATE INDEX idx_clients_state ON public.clients(state);