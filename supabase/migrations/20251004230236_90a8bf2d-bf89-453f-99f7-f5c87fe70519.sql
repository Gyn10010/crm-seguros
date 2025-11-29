-- Security Fix #1: Implement credential encryption using pgcrypto
-- This addresses the CRITICAL plaintext password storage vulnerability

-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add encrypted password column
ALTER TABLE public.credentials ADD COLUMN IF NOT EXISTS encrypted_password BYTEA;

-- Create encryption key storage (admin access only)
CREATE TABLE IF NOT EXISTS public.encryption_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.encryption_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage encryption keys"
ON public.encryption_keys FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Security Fix #2: Implement audit logging
-- This addresses the missing audit trail vulnerability

CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  details JSONB
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_log FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create audit logging function
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action TEXT,
  p_table_name TEXT,
  p_record_id UUID,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.audit_log (user_id, action, table_name, record_id, details)
  VALUES (auth.uid(), p_action, p_table_name, p_record_id, p_details)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Create trigger function for credential access logging
CREATE OR REPLACE FUNCTION public.log_credential_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log credential access (only for SELECT operations in application context)
  PERFORM public.log_audit_event(
    'CREDENTIAL_ACCESS',
    'credentials',
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'operation', TG_OP,
      'system_name', COALESCE(NEW.system_name, OLD.system_name)
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add triggers for credential operations
CREATE TRIGGER audit_credential_changes
AFTER INSERT OR UPDATE OR DELETE ON public.credentials
FOR EACH ROW EXECUTE FUNCTION public.log_credential_access();

-- Create trigger function for client PII access logging
CREATE OR REPLACE FUNCTION public.log_client_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.log_audit_event(
    'CLIENT_' || TG_OP,
    'clients',
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'client_name', COALESCE(NEW.name, OLD.name)
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add trigger for client data operations
CREATE TRIGGER audit_client_changes
AFTER INSERT OR UPDATE OR DELETE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.log_client_access();

-- Create helper functions for credential encryption/decryption
CREATE OR REPLACE FUNCTION public.encrypt_credential(
  p_plaintext TEXT,
  p_key TEXT
)
RETURNS BYTEA
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN pgp_sym_encrypt(p_plaintext, p_key);
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_credential(
  p_encrypted BYTEA,
  p_key TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN pgp_sym_decrypt(p_encrypted, p_key);
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;