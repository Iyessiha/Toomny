-- Migration 0027 : corriger les politiques RLS du bucket chat-attachments
-- H-1 : restreindre la lecture aux seuls participants de la commande
-- H-2 : restreindre l'upload au dossier de la commande dont l'utilisateur est participant
--
-- Chemin des fichiers : {order_id}/{timestamp}_{random}.{ext}
-- → (storage.foldername(name))[1] extrait l'order_id (premier segment du chemin)

-- ─── Suppression des anciennes politiques trop permissives ────────────────────

DROP POLICY IF EXISTS chat_attach_read   ON storage.objects;
DROP POLICY IF EXISTS chat_attach_upload ON storage.objects;

-- ─── H-1 : lecture restreinte aux participants de la commande ─────────────────

CREATE POLICY chat_attach_read ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'chat-attachments'
    AND EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id::text = (storage.foldername(name))[1]
        AND (o.client_id = auth.uid() OR o.provider_id = auth.uid())
    )
  );

-- ─── H-2 : upload restreint au dossier de la commande dont l'utilisateur est participant ──

CREATE POLICY chat_attach_upload ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'chat-attachments'
    AND EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id::text = (storage.foldername(name))[1]
        AND (o.client_id = auth.uid() OR o.provider_id = auth.uid())
    )
  );
