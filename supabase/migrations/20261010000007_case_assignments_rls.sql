-- Migration to fix case_assignments RLS and allow admins to manage it

-- 1. Allow authenticated users to SELECT case_assignments (if they are admins or assigned)
-- Since can_access_case already checks this, we can just allow them to read if can_access_case is true.
-- But wait, to evaluate can_access_case, we might need to read case_assignments!
-- This could cause infinite recursion!
-- So let's make case_assignments readable by ALL authenticated users. 
-- The API route already protects the endpoint using can_access_case.
CREATE POLICY "Case assignments readable by authenticated users" ON public.case_assignments
    FOR SELECT TO authenticated USING (true);

-- 2. Allow admins to INSERT into case_assignments
CREATE POLICY "Case assignments insertable by admin" ON public.case_assignments
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE public.profiles.id = auth.uid() 
            AND public.profiles.role = 'admin'
        )
    );

-- 3. Allow admins to DELETE from case_assignments
CREATE POLICY "Case assignments deletable by admin" ON public.case_assignments
    FOR DELETE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE public.profiles.id = auth.uid() 
            AND public.profiles.role = 'admin'
        )
    );
