import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      throw new Error('Unauthorized: Admin access required');
    }

    const { action, credentialId, insurance_company_id, system_name, login, password } = await req.json();
    const encryptionKey = Deno.env.get('CREDENTIAL_ENCRYPTION_KEY');

    if (!encryptionKey) {
      throw new Error('Encryption key not configured');
    }

    // Handle different actions
    if (action === 'get') {
      // Get and decrypt a single credential
      if (!credentialId) {
        throw new Error('Credential ID required for get action');
      }

      const { data: credential, error: getError } = await supabaseAdmin
        .from('credentials')
        .select('id, insurance_company_id, system_name, login, encrypted_password')
        .eq('id', credentialId)
        .single();

      if (getError) throw getError;

      // Decrypt password if it exists
      let decryptedPassword = null;
      if (credential.encrypted_password) {
        const { data: decrypted, error: decryptError } = await supabaseAdmin
          .rpc('decrypt_credential', {
            p_encrypted: credential.encrypted_password,
            p_key: encryptionKey
          });
        
        if (decryptError) {
          console.error('Decryption error:', decryptError);
        } else {
          decryptedPassword = decrypted;
        }
      }

      return new Response(
        JSON.stringify({ 
          ...credential, 
          password: decryptedPassword,
          encrypted_password: undefined 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'list') {
      // Get all credentials with decrypted passwords
      const { data: credentials, error: listError } = await supabaseAdmin
        .from('credentials')
        .select('id, insurance_company_id, system_name, login, encrypted_password')
        .order('system_name');

      if (listError) throw listError;

      // Decrypt all passwords
      const decryptedCredentials = await Promise.all(
        (credentials || []).map(async (cred) => {
          let decryptedPassword = null;
          if (cred.encrypted_password) {
            const { data: decrypted } = await supabaseAdmin
              .rpc('decrypt_credential', {
                p_encrypted: cred.encrypted_password,
                p_key: encryptionKey
              });
            decryptedPassword = decrypted;
          }
          return {
            ...cred,
            password: decryptedPassword,
            encrypted_password: undefined
          };
        })
      );

      return new Response(
        JSON.stringify(decryptedCredentials),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'create' || action === 'update') {
      // Validate inputs
      if (!system_name || typeof system_name !== 'string') {
        throw new Error('Valid system_name is required');
      }

      if (!login || typeof login !== 'string') {
        throw new Error('Valid login is required');
      }

      // Encrypt password if provided
      let encryptedPassword = null;
      if (password && password.trim() !== '') {
        const { data: encrypted, error: encryptError } = await supabaseAdmin
          .rpc('encrypt_credential', {
            p_plaintext: password,
            p_key: encryptionKey
          });

        if (encryptError) {
          console.error('Encryption error:', encryptError);
          throw new Error('Failed to encrypt password');
        }

        encryptedPassword = encrypted;
      }

      if (action === 'create') {
        if (!insurance_company_id) {
          throw new Error('insurance_company_id is required for create');
        }

        const { data, error } = await supabaseAdmin
          .from('credentials')
          .insert({
            insurance_company_id,
            system_name,
            login,
            encrypted_password: encryptedPassword,
            password: null // Keep old field null for migration
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (action === 'update') {
        if (!credentialId) {
          throw new Error('Credential ID required for update action');
        }

        const updateData: any = {
          system_name,
          login,
          password: null // Keep old field null
        };

        // Only update encrypted_password if a new password was provided
        if (encryptedPassword !== null) {
          updateData.encrypted_password = encryptedPassword;
        }

        const { data, error } = await supabaseAdmin
          .from('credentials')
          .update(updateData)
          .eq('id', credentialId)
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error in manage-credentials function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
