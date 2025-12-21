CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: energy_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.energy_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    equipment_id uuid NOT NULL,
    energy_consumption numeric NOT NULL,
    efficiency numeric NOT NULL,
    is_on boolean NOT NULL,
    recorded_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: environments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.environments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    equipment_ids text[] DEFAULT '{}'::text[] NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: equipments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    location text NOT NULL,
    model text NOT NULL,
    capacity integer NOT NULL,
    integration text NOT NULL,
    is_on boolean DEFAULT false NOT NULL,
    current_temp numeric DEFAULT 25 NOT NULL,
    target_temp numeric DEFAULT 22 NOT NULL,
    mode text DEFAULT 'cool'::text NOT NULL,
    energy_consumption numeric DEFAULT 0 NOT NULL,
    efficiency numeric DEFAULT 85 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    smartthings_device_id text,
    smartthings_capabilities jsonb,
    last_synced_at timestamp with time zone,
    CONSTRAINT equipments_integration_check CHECK ((integration = ANY (ARRAY['BRISE'::text, 'SMART'::text]))),
    CONSTRAINT equipments_mode_check CHECK ((mode = ANY (ARRAY['cool'::text, 'heat'::text, 'auto'::text, 'fan'::text])))
);


--
-- Name: smartthings_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.smartthings_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    personal_access_token text NOT NULL,
    location_id text,
    is_active boolean DEFAULT true NOT NULL,
    last_sync_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: temperature_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.temperature_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    equipment_id uuid NOT NULL,
    current_temp numeric NOT NULL,
    target_temp numeric NOT NULL,
    mode text NOT NULL,
    recorded_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: time_routine_environments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.time_routine_environments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    routine_id uuid NOT NULL,
    environment_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: time_routine_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.time_routine_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    routine_id uuid NOT NULL,
    day_of_week text NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: time_routines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.time_routines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: energy_history energy_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.energy_history
    ADD CONSTRAINT energy_history_pkey PRIMARY KEY (id);


--
-- Name: environments environments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.environments
    ADD CONSTRAINT environments_pkey PRIMARY KEY (id);


--
-- Name: equipments equipments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipments
    ADD CONSTRAINT equipments_pkey PRIMARY KEY (id);


--
-- Name: smartthings_config smartthings_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.smartthings_config
    ADD CONSTRAINT smartthings_config_pkey PRIMARY KEY (id);


--
-- Name: temperature_history temperature_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.temperature_history
    ADD CONSTRAINT temperature_history_pkey PRIMARY KEY (id);


--
-- Name: time_routine_environments time_routine_environments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_routine_environments
    ADD CONSTRAINT time_routine_environments_pkey PRIMARY KEY (id);


--
-- Name: time_routine_environments time_routine_environments_routine_id_environment_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_routine_environments
    ADD CONSTRAINT time_routine_environments_routine_id_environment_id_key UNIQUE (routine_id, environment_id);


--
-- Name: time_routine_schedules time_routine_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_routine_schedules
    ADD CONSTRAINT time_routine_schedules_pkey PRIMARY KEY (id);


--
-- Name: time_routines time_routines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_routines
    ADD CONSTRAINT time_routines_pkey PRIMARY KEY (id);


--
-- Name: idx_energy_history_equipment_recorded; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_energy_history_equipment_recorded ON public.energy_history USING btree (equipment_id, recorded_at DESC);


--
-- Name: idx_energy_history_recorded; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_energy_history_recorded ON public.energy_history USING btree (recorded_at DESC);


--
-- Name: idx_temperature_history_equipment_recorded; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_temperature_history_equipment_recorded ON public.temperature_history USING btree (equipment_id, recorded_at DESC);


--
-- Name: idx_temperature_history_recorded; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_temperature_history_recorded ON public.temperature_history USING btree (recorded_at DESC);


--
-- Name: environments update_environments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_environments_updated_at BEFORE UPDATE ON public.environments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: equipments update_equipments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_equipments_updated_at BEFORE UPDATE ON public.equipments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: smartthings_config update_smartthings_config_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_smartthings_config_updated_at BEFORE UPDATE ON public.smartthings_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: time_routines update_time_routines_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_time_routines_updated_at BEFORE UPDATE ON public.time_routines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: energy_history energy_history_equipment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.energy_history
    ADD CONSTRAINT energy_history_equipment_id_fkey FOREIGN KEY (equipment_id) REFERENCES public.equipments(id) ON DELETE CASCADE;


--
-- Name: temperature_history temperature_history_equipment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.temperature_history
    ADD CONSTRAINT temperature_history_equipment_id_fkey FOREIGN KEY (equipment_id) REFERENCES public.equipments(id) ON DELETE CASCADE;


--
-- Name: time_routine_environments time_routine_environments_routine_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_routine_environments
    ADD CONSTRAINT time_routine_environments_routine_id_fkey FOREIGN KEY (routine_id) REFERENCES public.time_routines(id) ON DELETE CASCADE;


--
-- Name: time_routine_schedules time_routine_schedules_routine_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_routine_schedules
    ADD CONSTRAINT time_routine_schedules_routine_id_fkey FOREIGN KEY (routine_id) REFERENCES public.time_routines(id) ON DELETE CASCADE;


--
-- Name: energy_history Anyone can delete energy_history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can delete energy_history" ON public.energy_history FOR DELETE USING (true);


--
-- Name: environments Anyone can delete environments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can delete environments" ON public.environments FOR DELETE USING (true);


--
-- Name: equipments Anyone can delete equipments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can delete equipments" ON public.equipments FOR DELETE USING (true);


--
-- Name: smartthings_config Anyone can delete smartthings_config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can delete smartthings_config" ON public.smartthings_config FOR DELETE USING (true);


--
-- Name: temperature_history Anyone can delete temperature_history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can delete temperature_history" ON public.temperature_history FOR DELETE USING (true);


--
-- Name: time_routine_environments Anyone can delete time_routine_environments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can delete time_routine_environments" ON public.time_routine_environments FOR DELETE USING (true);


--
-- Name: time_routine_schedules Anyone can delete time_routine_schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can delete time_routine_schedules" ON public.time_routine_schedules FOR DELETE USING (true);


--
-- Name: time_routines Anyone can delete time_routines; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can delete time_routines" ON public.time_routines FOR DELETE USING (true);


--
-- Name: energy_history Anyone can insert energy_history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert energy_history" ON public.energy_history FOR INSERT WITH CHECK (true);


--
-- Name: environments Anyone can insert environments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert environments" ON public.environments FOR INSERT WITH CHECK (true);


--
-- Name: equipments Anyone can insert equipments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert equipments" ON public.equipments FOR INSERT WITH CHECK (true);


--
-- Name: smartthings_config Anyone can insert smartthings_config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert smartthings_config" ON public.smartthings_config FOR INSERT WITH CHECK (true);


--
-- Name: temperature_history Anyone can insert temperature_history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert temperature_history" ON public.temperature_history FOR INSERT WITH CHECK (true);


--
-- Name: time_routine_environments Anyone can insert time_routine_environments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert time_routine_environments" ON public.time_routine_environments FOR INSERT WITH CHECK (true);


--
-- Name: time_routine_schedules Anyone can insert time_routine_schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert time_routine_schedules" ON public.time_routine_schedules FOR INSERT WITH CHECK (true);


--
-- Name: time_routines Anyone can insert time_routines; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert time_routines" ON public.time_routines FOR INSERT WITH CHECK (true);


--
-- Name: energy_history Anyone can read energy_history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read energy_history" ON public.energy_history FOR SELECT USING (true);


--
-- Name: environments Anyone can read environments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read environments" ON public.environments FOR SELECT USING (true);


--
-- Name: equipments Anyone can read equipments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read equipments" ON public.equipments FOR SELECT USING (true);


--
-- Name: smartthings_config Anyone can read smartthings_config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read smartthings_config" ON public.smartthings_config FOR SELECT USING (true);


--
-- Name: temperature_history Anyone can read temperature_history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read temperature_history" ON public.temperature_history FOR SELECT USING (true);


--
-- Name: time_routine_environments Anyone can read time_routine_environments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read time_routine_environments" ON public.time_routine_environments FOR SELECT USING (true);


--
-- Name: time_routine_schedules Anyone can read time_routine_schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read time_routine_schedules" ON public.time_routine_schedules FOR SELECT USING (true);


--
-- Name: time_routines Anyone can read time_routines; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read time_routines" ON public.time_routines FOR SELECT USING (true);


--
-- Name: environments Anyone can update environments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can update environments" ON public.environments FOR UPDATE USING (true);


--
-- Name: equipments Anyone can update equipments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can update equipments" ON public.equipments FOR UPDATE USING (true);


--
-- Name: smartthings_config Anyone can update smartthings_config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can update smartthings_config" ON public.smartthings_config FOR UPDATE USING (true);


--
-- Name: time_routine_environments Anyone can update time_routine_environments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can update time_routine_environments" ON public.time_routine_environments FOR UPDATE USING (true);


--
-- Name: time_routine_schedules Anyone can update time_routine_schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can update time_routine_schedules" ON public.time_routine_schedules FOR UPDATE USING (true);


--
-- Name: time_routines Anyone can update time_routines; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can update time_routines" ON public.time_routines FOR UPDATE USING (true);


--
-- Name: energy_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.energy_history ENABLE ROW LEVEL SECURITY;

--
-- Name: environments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.environments ENABLE ROW LEVEL SECURITY;

--
-- Name: equipments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.equipments ENABLE ROW LEVEL SECURITY;

--
-- Name: smartthings_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.smartthings_config ENABLE ROW LEVEL SECURITY;

--
-- Name: temperature_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.temperature_history ENABLE ROW LEVEL SECURITY;

--
-- Name: time_routine_environments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.time_routine_environments ENABLE ROW LEVEL SECURITY;

--
-- Name: time_routine_schedules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.time_routine_schedules ENABLE ROW LEVEL SECURITY;

--
-- Name: time_routines; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.time_routines ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;