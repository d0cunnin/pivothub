-- Update course-media bucket to be private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'course-media';

-- Remove the existing public access policy
DROP POLICY IF EXISTS "Course media is publicly accessible" ON storage.objects;

-- Create authenticated access policies for course videos
CREATE POLICY "Authenticated users can view course media" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'course-media' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can upload course media" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'course-media' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update course media" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'course-media' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete course media" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'course-media' 
  AND auth.role() = 'authenticated'
);