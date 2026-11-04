CREATE TABLE public.account_controls (user_id uuid PRIMARY KEY, suspended boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.account_controls TO authenticated;
GRANT ALL ON public.account_controls TO service_role;
ALTER TABLE public.account_controls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own control" ON public.account_controls FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE TABLE public.report_translations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, report_id uuid NOT NULL, source_version text NOT NULL, language text NOT NULL, presentation jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,report_id,source_version,language));
GRANT SELECT ON public.report_translations TO authenticated;
GRANT ALL ON public.report_translations TO service_role;
ALTER TABLE public.report_translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own translations" ON public.report_translations FOR SELECT TO authenticated USING(user_id=auth.uid() AND public.session_active());
CREATE OR REPLACE FUNCTION public.session_active() RETURNS boolean LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=public AS $$
DECLARE sid uuid; activity timestamptz; blocked boolean; minutes integer;
BEGIN
 IF auth.uid() IS NULL THEN RETURN false; END IF;
 IF EXISTS(SELECT 1 FROM public.account_controls WHERE user_id=auth.uid() AND suspended) THEN RETURN false; END IF;
 sid := NULLIF(auth.jwt()->>'session_id','')::uuid;
 IF sid IS NULL THEN RETURN false; END IF;
 INSERT INTO public.app_sessions(user_id,session_id) VALUES(auth.uid(),sid) ON CONFLICT DO NOTHING;
 SELECT last_active_at,revoked INTO activity,blocked FROM public.app_sessions WHERE user_id=auth.uid() AND session_id=sid;
 SELECT inactivity_minutes INTO minutes FROM public.app_settings WHERE id='global';
 RETURN NOT blocked AND activity > now()-make_interval(mins=>COALESCE(minutes,15));
END $$;
CREATE FUNCTION public.admin_overview() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT public.session_active() OR NOT(public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) THEN RAISE EXCEPTION 'Administrator access required'; END IF;
 RETURN jsonb_build_object('users',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',u.id,'email',u.email,'created_at',u.created_at,'suspended',COALESCE(c.suspended,false),'roles',COALESCE((SELECT jsonb_agg(r.role) FROM public.user_roles r WHERE r.user_id=u.id),'[]'::jsonb),'subscription',(SELECT to_jsonb(s) FROM public.subscriptions s WHERE s.user_id=u.id),'analysis_used',(SELECT count(*) FROM public.usage_events e WHERE e.user_id=u.id AND e.kind='analysis' AND e.state<>'released' AND e.period_start=date_trunc('month',now())::date),'report_used',(SELECT count(*) FROM public.usage_events e WHERE e.user_id=u.id AND e.kind='report' AND e.state<>'released' AND e.period_start=date_trunc('month',now())::date))) FROM auth.users u LEFT JOIN public.account_controls c ON c.user_id=u.id),'[]'::jsonb),'audit',COALESCE((SELECT jsonb_agg(a) FROM (SELECT actor_id,action,target_id,details,created_at FROM public.admin_audit ORDER BY created_at DESC LIMIT 100) a),'[]'::jsonb),'super_admin',public.has_role(auth.uid(),'super_admin'));
END $$;
REVOKE ALL ON FUNCTION public.admin_overview() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_overview() TO authenticated;
CREATE FUNCTION public.admin_set_suspension(_user uuid,_suspended boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT public.session_active() OR NOT(public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) THEN RAISE EXCEPTION 'Administrator access required'; END IF;
 IF _user=auth.uid() OR public.has_role(_user,'super_admin') OR (public.has_role(_user,'admin') AND NOT public.has_role(auth.uid(),'super_admin')) THEN RAISE EXCEPTION 'Cannot suspend this privileged account'; END IF;
 IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id=_user) THEN RAISE EXCEPTION 'Account not found'; END IF;
 INSERT INTO public.account_controls(user_id,suspended) VALUES(_user,_suspended) ON CONFLICT(user_id) DO UPDATE SET suspended=EXCLUDED.suspended,updated_at=now();
 IF _suspended THEN UPDATE public.app_sessions SET revoked=true WHERE user_id=_user; END IF;
 INSERT INTO public.admin_audit(actor_id,action,target_id,details) VALUES(auth.uid(),'set_suspension',_user::text,jsonb_build_object('suspended',_suspended));
END $$;
REVOKE ALL ON FUNCTION public.admin_set_suspension(uuid,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_suspension(uuid,boolean) TO authenticated;
CREATE FUNCTION public.admin_set_role(_user uuid,_role public.app_role) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT public.session_active() OR NOT public.has_role(auth.uid(),'super_admin') THEN RAISE EXCEPTION 'Super Administrator access required'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('finscope_roles',0));
 IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id=_user) THEN RAISE EXCEPTION 'Account not found'; END IF;
 IF public.has_role(_user,'super_admin') AND _role<>'super_admin' AND (SELECT count(*) FROM public.user_roles WHERE role='super_admin')<=1 THEN RAISE EXCEPTION 'The last Super Administrator must be retained'; END IF;
 DELETE FROM public.user_roles WHERE user_id=_user;
 INSERT INTO public.user_roles(user_id,role) VALUES(_user,_role);
 INSERT INTO public.admin_audit(actor_id,action,target_id,details) VALUES(auth.uid(),'set_role',_user::text,jsonb_build_object('role',_role));
END $$;
REVOKE ALL ON FUNCTION public.admin_set_role(uuid,public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_role(uuid,public.app_role) TO authenticated;
CREATE FUNCTION public.feature_allowed(_feature text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE enforce boolean; p public.subscription_plans; s public.subscriptions;
BEGIN
 IF NOT public.session_active() THEN RETURN false; END IF;
 SELECT enforce_subscriptions INTO enforce FROM public.app_settings WHERE id='global';
 IF NOT COALESCE(enforce,false) THEN RETURN true; END IF;
 SELECT * INTO s FROM public.subscriptions WHERE user_id=auth.uid();
 IF s.user_id IS NULL OR s.status NOT IN ('active','trialing','cancelled') OR (s.expires_at IS NOT NULL AND s.expires_at<=now()) THEN RETURN false; END IF;
 SELECT * INTO p FROM public.subscription_plans WHERE id=s.plan_id AND active;
 IF p.id IS NULL THEN RETURN false; END IF;
 RETURN COALESCE((p.features->>_feature)::boolean,false);
END $$;
REVOKE ALL ON FUNCTION public.feature_allowed(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.feature_allowed(text) TO authenticated;
CREATE FUNCTION public.reserve_analysis(_analysis uuid) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE enforce boolean; p public.subscription_plans; s public.subscriptions; limit_count integer; kind_name text; state_name text;
BEGIN
 IF NOT public.session_active() THEN RAISE EXCEPTION 'Session expired'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 IF NOT EXISTS(SELECT 1 FROM public.analyses WHERE id=_analysis AND user_id=auth.uid()) THEN RAISE EXCEPTION 'Analysis not found'; END IF;
 IF EXISTS(SELECT 1 FROM public.analyses WHERE id=_analysis AND status='completed') THEN RETURN 'completed'; END IF;
 SELECT state INTO state_name FROM public.usage_events WHERE user_id=auth.uid() AND operation_id=_analysis AND kind='analysis';
 IF state_name='reserved' THEN RAISE EXCEPTION 'This analysis is already running'; END IF;
 SELECT enforce_subscriptions INTO enforce FROM public.app_settings WHERE id='global';
 IF COALESCE(enforce,false) THEN
  SELECT * INTO s FROM public.subscriptions WHERE user_id=auth.uid();
  IF s.user_id IS NULL OR s.status NOT IN ('active','trialing','cancelled') OR (s.expires_at IS NOT NULL AND s.expires_at<=now()) THEN RAISE EXCEPTION 'An active membership is required'; END IF;
  SELECT * INTO p FROM public.subscription_plans WHERE id=s.plan_id AND active;
  IF p.id IS NULL OR p.analysis_limit IS NULL OR p.report_limit IS NULL THEN RAISE EXCEPTION 'Plan allowances are not configured'; END IF;
 END IF;
 FOREACH kind_name IN ARRAY ARRAY['analysis','report'] LOOP
  limit_count:=CASE WHEN kind_name='analysis' THEN p.analysis_limit ELSE p.report_limit END;
  IF COALESCE(enforce,false) AND (SELECT count(*) FROM public.usage_events WHERE user_id=auth.uid() AND kind=kind_name AND state<>'released' AND period_start=date_trunc('month',now())::date)>=limit_count THEN RAISE EXCEPTION 'Monthly % allowance reached',kind_name; END IF;
  INSERT INTO public.usage_events(user_id,operation_id,kind) VALUES(auth.uid(),_analysis,kind_name) ON CONFLICT(user_id,operation_id,kind) DO UPDATE SET state='reserved',period_start=date_trunc('month',now())::date,created_at=now();
 END LOOP;
 UPDATE public.analyses SET status='processing',error_message=NULL WHERE id=_analysis AND user_id=auth.uid();
 RETURN 'reserved';
END $$;
REVOKE ALL ON FUNCTION public.reserve_analysis(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reserve_analysis(uuid) TO authenticated;
CREATE FUNCTION public.finish_analysis(_analysis uuid,_success boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT public.session_active() THEN RAISE EXCEPTION 'Session expired'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.analyses WHERE id=_analysis AND user_id=auth.uid()) THEN RAISE EXCEPTION 'Analysis not found'; END IF;
 UPDATE public.usage_events SET state=CASE WHEN _success THEN 'completed' ELSE 'released' END WHERE user_id=auth.uid() AND operation_id=_analysis AND state='reserved';
END $$;
REVOKE ALL ON FUNCTION public.finish_analysis(uuid,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finish_analysis(uuid,boolean) TO authenticated;
CREATE FUNCTION public.guard_company_allowance() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE enforce boolean; allowed integer;
BEGIN
 IF auth.uid() IS NULL THEN RETURN NEW; END IF;
 IF NEW.user_id<>auth.uid() OR NOT public.session_active() THEN RAISE EXCEPTION 'Company access denied'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 SELECT enforce_subscriptions INTO enforce FROM public.app_settings WHERE id='global';
 IF COALESCE(enforce,false) THEN
  SELECT p.company_limit INTO allowed FROM public.subscriptions s JOIN public.subscription_plans p ON p.id=s.plan_id WHERE s.user_id=auth.uid() AND p.active AND s.status IN ('active','trialing','cancelled') AND (s.expires_at IS NULL OR s.expires_at>now());
  IF allowed IS NULL THEN RAISE EXCEPTION 'Company allowance not configured'; END IF;
  IF (SELECT count(*) FROM public.companies WHERE user_id=auth.uid())>=allowed THEN RAISE EXCEPTION 'Company allowance reached'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER company_allowance BEFORE INSERT ON public.companies FOR EACH ROW EXECUTE FUNCTION public.guard_company_allowance();
CREATE POLICY "active session translations controls" ON public.account_controls AS RESTRICTIVE FOR SELECT TO authenticated USING(public.session_active());