-- Enum additions must commit before later migrations use the new values.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'OWNER';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'WORK_MANAGER';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ADMIN';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'USER';
