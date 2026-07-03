-- Create profiles for existing auth users that don't have one
INSERT INTO public.profiles (id, user_id, name, full_name, role)
SELECT id, id, email, email, 'admin'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.profiles WHERE user_id IS NOT NULL)
ON CONFLICT DO NOTHING;

-- Security definer function to check superadmin (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'superadmin'
  );
$$;

-- RLS policies for profiles
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Superadmin read all" ON profiles;
CREATE POLICY "Superadmin read all"
  ON profiles FOR SELECT TO authenticated
  USING (public.is_superadmin());

DROP POLICY IF EXISTS "Superadmin insert" ON profiles;
CREATE POLICY "Superadmin insert"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (public.is_superadmin());

DROP POLICY IF EXISTS "Superadmin update all" ON profiles;
CREATE POLICY "Superadmin update all"
  ON profiles FOR UPDATE TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, name, full_name, role)
  VALUES (
    NEW.id,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'admin')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
