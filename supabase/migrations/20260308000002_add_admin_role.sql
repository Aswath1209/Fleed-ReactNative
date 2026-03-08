-- Add is_admin column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Elevate the current user (Aswath) to Admin status as the app owner
UPDATE public.users SET is_admin = TRUE WHERE email = 'aswath1gh209@gmail.com' OR email = 'zoro071209@gmail.com'; 

-- Update Challenge Policies to restrict insert/update/delete to Admins only
CREATE POLICY "Admins can create challenges" ON public.challenges FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.is_admin = TRUE)
);

CREATE POLICY "Admins can update challenges" ON public.challenges FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.is_admin = TRUE)
);

CREATE POLICY "Admins can delete challenges" ON public.challenges FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.is_admin = TRUE)
);
