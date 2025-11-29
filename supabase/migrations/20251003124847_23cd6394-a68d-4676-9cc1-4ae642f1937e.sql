-- Create table for funnel activity templates
CREATE TABLE public.funnel_activity_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  funnel_type TEXT NOT NULL,
  stage TEXT NOT NULL,
  activity_text TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.funnel_activity_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own funnel activity templates"
  ON public.funnel_activity_templates
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own funnel activity templates"
  ON public.funnel_activity_templates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own funnel activity templates"
  ON public.funnel_activity_templates
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own funnel activity templates"
  ON public.funnel_activity_templates
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_funnel_activity_templates_updated_at
  BEFORE UPDATE ON public.funnel_activity_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert some default templates for new users
CREATE OR REPLACE FUNCTION public.create_default_funnel_templates(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Sales funnel templates
  INSERT INTO public.funnel_activity_templates (user_id, funnel_type, stage, activity_text, order_index) VALUES
    (p_user_id, 'Vendas', 'Lead', 'Primeiro contato com o cliente', 0),
    (p_user_id, 'Vendas', 'Lead', 'Qualificação das necessidades', 1),
    (p_user_id, 'Vendas', 'Proposta', 'Enviar cotação', 0),
    (p_user_id, 'Vendas', 'Proposta', 'Apresentar proposta', 1),
    (p_user_id, 'Vendas', 'Negociação', 'Negociar condições', 0),
    (p_user_id, 'Vendas', 'Negociação', 'Ajustar proposta', 1),
    (p_user_id, 'Vendas', 'Fechamento', 'Emitir apólice', 0),
    (p_user_id, 'Vendas', 'Fechamento', 'Enviar documentação', 1);
  
  -- Renewal funnel templates
  INSERT INTO public.funnel_activity_templates (user_id, funnel_type, stage, activity_text, order_index) VALUES
    (p_user_id, 'Renovação', 'Novo', 'Contatar cliente para renovação', 0),
    (p_user_id, 'Renovação', 'Novo', 'Verificar dados atualizados', 1),
    (p_user_id, 'Renovação', 'Em Andamento', 'Enviar proposta de renovação', 0),
    (p_user_id, 'Renovação', 'Em Andamento', 'Acompanhar resposta', 1),
    (p_user_id, 'Renovação', 'Concluído', 'Confirmar renovação', 0),
    (p_user_id, 'Renovação', 'Concluído', 'Atualizar dados no sistema', 1);
END;
$$;