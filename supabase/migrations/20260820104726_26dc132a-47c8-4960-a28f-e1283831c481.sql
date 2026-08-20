CREATE POLICY "Owners can update their aurixen files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'aurixen-files' AND owner = auth.uid())
WITH CHECK (bucket_id = 'aurixen-files' AND owner = auth.uid());