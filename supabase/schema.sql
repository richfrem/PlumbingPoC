

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."accept_quote_and_update_request"("p_request_id" "uuid", "p_quote_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Step 1: Update the selected quote's status to 'accepted'
  UPDATE public.quotes
  SET status = 'accepted'
  WHERE id = p_quote_id AND request_id = p_request_id;

  -- Step 2: Update all other quotes for the same request to 'rejected'
  UPDATE public.quotes
  SET status = 'rejected'
  WHERE request_id = p_request_id AND id <> p_quote_id;

  -- Step 3: Update the parent request's status to 'accepted'
  UPDATE public.requests
  SET status = 'accepted'
  WHERE id = p_request_id;
END;
$$;


ALTER FUNCTION "public"."accept_quote_and_update_request"("p_request_id" "uuid", "p_quote_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_user_data"("target_user_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  request_ids uuid[];
  quote_ids uuid[];
BEGIN
  -- NO SECURITY CHECK HERE - This function is for direct admin use.

  -- Step 1: Gather all request IDs for the target user.
  SELECT array_agg(id) INTO request_ids FROM public.requests WHERE user_id = target_user_id;

  IF array_length(request_ids, 1) IS NULL THEN
    RETURN 'No requests found for the specified user. Nothing to delete.';
  END IF;

  -- Step 2: Gather all quote IDs associated with those requests.
  SELECT array_agg(id) INTO quote_ids FROM public.quotes WHERE request_id = ANY(request_ids);

  -- Step 3: Delete data in the correct cascading order.
  IF array_length(quote_ids, 1) IS NOT NULL THEN
    DELETE FROM public.invoices WHERE quote_id = ANY(quote_ids);
  END IF;
  
  DELETE FROM public.quote_attachments WHERE request_id = ANY(request_ids);
  DELETE FROM public.request_notes WHERE request_id = ANY(request_ids);
  
  IF array_length(quote_ids, 1) IS NOT NULL THEN
    DELETE FROM public.quotes WHERE id = ANY(quote_ids);
  END IF;

  -- Step 4: Delete the parent requests.
  DELETE FROM public.requests WHERE id = ANY(request_ids);

  RETURN 'v2: Successfully deleted all requests and related data for user ' || target_user_id;
END;
$$;


ALTER FUNCTION "public"."delete_user_data"("target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN (
    SELECT EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
END;
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"("user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE user_id = is_admin.user_id
      AND role = 'admin'
  );
$$;


ALTER FUNCTION "public"."is_admin"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_quote_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Find the highest existing quote_number for the same request_id,
  -- add 1 to it. If no quotes exist yet (the result is NULL), start at 1.
  NEW.quote_number := (
    SELECT COALESCE(MAX(quote_number), 0) + 1
    FROM public.quotes
    WHERE request_id = NEW.request_id
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_quote_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_invoice_status_to_request"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Only update request status if invoice status changed
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) OR TG_OP = 'INSERT' THEN
    
    -- Update the associated request's status based on invoice status
    UPDATE public.requests
    SET status = CASE NEW.status
      WHEN 'sent' THEN 'invoiced'
      WHEN 'paid' THEN 'paid'
      WHEN 'overdue' THEN 'overdue'
      WHEN 'disputed' THEN 'disputed'
      WHEN 'cancelled' THEN 'completed'  -- Return to completed if invoice cancelled
      ELSE status  -- Keep current status for 'draft' and other states
    END
    WHERE id = (
      SELECT id FROM public.requests WHERE invoice_id = NEW.id
    );
    
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_invoice_status_to_request"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."sync_invoice_status_to_request"() IS 'Automatically updates request.status when invoice.status changes';



CREATE OR REPLACE FUNCTION "public"."update_requests_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_requests_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_role_from_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Check if the role column is actually being updated to avoid unnecessary writes
  IF TG_OP = 'INSERT' OR NEW.role IS DISTINCT FROM OLD.role THEN
    UPDATE auth.users
    SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('role', NEW.role)
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_role_from_profile"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "quote_id" "uuid",
    "amount_due" numeric,
    "due_date" timestamp with time zone,
    "status" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "line_items" "jsonb",
    "subtotal" numeric(10,2),
    "tax_rate" numeric(5,2) DEFAULT 0.13,
    "tax_amount" numeric(10,2),
    "total" numeric(10,2),
    "paid_at" timestamp with time zone,
    "payment_method" "text",
    "stripe_payment_intent_id" "text",
    "notes" "text",
    "ai_generated" boolean DEFAULT false,
    "ai_variance_explanation" "text",
    CONSTRAINT "invoices_payment_method_check" CHECK (("payment_method" = ANY (ARRAY['stripe'::"text", 'check'::"text", 'cash'::"text", 'etransfer'::"text", 'other'::"text"]))),
    CONSTRAINT "invoices_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'sent'::"text", 'paid'::"text", 'overdue'::"text", 'cancelled'::"text", 'disputed'::"text", 'partially_paid'::"text"])))
);


ALTER TABLE "public"."invoices" OWNER TO "postgres";


COMMENT ON COLUMN "public"."invoices"."amount_due" IS 'DEPRECATED: Use total instead. Kept for backward compatibility.';



COMMENT ON COLUMN "public"."invoices"."status" IS 'Invoice status: draft, sent, paid, overdue, cancelled, disputed, partially_paid';



COMMENT ON COLUMN "public"."invoices"."line_items" IS 'Array of line items: [{description, quantity, unit_price, total}, ...]';



COMMENT ON COLUMN "public"."invoices"."subtotal" IS 'Sum of all line items before tax';



COMMENT ON COLUMN "public"."invoices"."tax_rate" IS 'Tax rate as decimal (e.g., 0.13 for 13% tax)';



COMMENT ON COLUMN "public"."invoices"."tax_amount" IS 'Calculated tax amount (subtotal * tax_rate)';



COMMENT ON COLUMN "public"."invoices"."total" IS 'Final amount (subtotal + tax_amount)';



COMMENT ON COLUMN "public"."invoices"."paid_at" IS 'Timestamp when payment was received';



COMMENT ON COLUMN "public"."invoices"."payment_method" IS 'How customer paid: stripe, check, cash, etransfer, other';



COMMENT ON COLUMN "public"."invoices"."stripe_payment_intent_id" IS 'Stripe Payment Intent ID for online payments';



COMMENT ON COLUMN "public"."invoices"."notes" IS 'Admin notes or additional information for customer';



COMMENT ON COLUMN "public"."invoices"."ai_generated" IS 'True if invoice was generated by AI agent';



COMMENT ON COLUMN "public"."invoices"."ai_variance_explanation" IS 'AI-generated explanation for quote-to-invoice differences';



CREATE TABLE IF NOT EXISTS "public"."quote_attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "request_id" "uuid",
    "file_url" "text" NOT NULL,
    "file_name" "text",
    "mime_type" "text",
    "uploaded_at" timestamp with time zone DEFAULT "now"(),
    "quote_id" "uuid"
);


ALTER TABLE "public"."quote_attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quotes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "request_id" "uuid",
    "quote_amount" numeric,
    "status" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "labor_items" "jsonb",
    "material_items" "jsonb",
    "notes" "text",
    "good_until" "date",
    "tax_details" "jsonb",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "details" "text",
    "quote_number" integer
);


ALTER TABLE "public"."quotes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."request_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "request_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "author_role" "text" NOT NULL,
    "note" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."request_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_emergency" boolean,
    "customer_name" "text",
    "service_address" "text",
    "contact_info" "text",
    "problem_category" "text",
    "problem_description" "text",
    "property_type" "text",
    "is_homeowner" boolean,
    "preferred_timing" "text",
    "additional_notes" "text",
    "answers" "jsonb",
    "status" "text",
    "user_id" "uuid",
    "updated_at" timestamp with time zone,
    "scheduled_start_date" timestamp with time zone,
    "last_follow_up_sent_at" timestamp with time zone,
    "triage_summary" "text",
    "priority_score" integer,
    "profitability_score" integer,
    "priority_explanation" "text",
    "profitability_explanation" "text",
    "latitude" double precision,
    "longitude" double precision,
    "geocoded_address" "text",
    "actual_cost" numeric(10,2),
    "completion_notes" "text",
    "required_expertise" "jsonb",
    "invoice_id" "uuid",
    CONSTRAINT "chk_latitude_range" CHECK ((("latitude" >= ('-90'::integer)::double precision) AND ("latitude" <= (90)::double precision))),
    CONSTRAINT "chk_longitude_range" CHECK ((("longitude" >= ('-180'::integer)::double precision) AND ("longitude" <= (180)::double precision))),
    CONSTRAINT "requests_status_check" CHECK (("status" = ANY (ARRAY['new'::"text", 'viewed'::"text", 'quoted'::"text", 'accepted'::"text", 'scheduled'::"text", 'in_progress'::"text", 'completed'::"text", 'invoiced'::"text", 'paid'::"text", 'overdue'::"text", 'disputed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."requests" OWNER TO "postgres";


COMMENT ON COLUMN "public"."requests"."status" IS 'Request lifecycle status: new → quoted → accepted → scheduled → in_progress → completed → invoiced → paid/overdue/disputed';



COMMENT ON COLUMN "public"."requests"."actual_cost" IS 'The final, invoiced cost of the completed job.';



COMMENT ON COLUMN "public"."requests"."completion_notes" IS 'Internal notes logged by the admin when the job was marked as complete.';



COMMENT ON COLUMN "public"."requests"."required_expertise" IS 'AI-generated expertise requirements: skill_level (apprentice/journeyman/master), specialized_skills array, and reasoning';



COMMENT ON COLUMN "public"."requests"."invoice_id" IS 'Reference to associated invoice (if created)';



CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "name" "text",
    "email" "text",
    "phone" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "address" "text",
    "city" "text",
    "postal_code" "text",
    "province" "text",
    "role" "text" DEFAULT 'user'::"text" NOT NULL,
    "latitude" numeric(10,8),
    "longitude" numeric(11,8),
    "geocoded_address" "text"
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."user_profiles"."latitude" IS 'Cached latitude from Google Maps geocoding';



COMMENT ON COLUMN "public"."user_profiles"."longitude" IS 'Cached longitude from Google Maps geocoding';



COMMENT ON COLUMN "public"."user_profiles"."geocoded_address" IS 'Full formatted address from Google Maps';



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quote_attachments"
    ADD CONSTRAINT "quote_attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quotes"
    ADD CONSTRAINT "quotes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."request_notes"
    ADD CONSTRAINT "request_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."requests"
    ADD CONSTRAINT "requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_user_id_key" UNIQUE ("user_id");



CREATE INDEX "idx_invoices_due_date" ON "public"."invoices" USING "btree" ("due_date") WHERE ("status" = 'sent'::"text");



CREATE INDEX "idx_invoices_paid_at" ON "public"."invoices" USING "btree" ("paid_at");



CREATE INDEX "idx_invoices_status" ON "public"."invoices" USING "btree" ("status");



CREATE INDEX "idx_invoices_stripe_payment_intent" ON "public"."invoices" USING "btree" ("stripe_payment_intent_id");



CREATE INDEX "idx_quote_attachments_quote_id" ON "public"."quote_attachments" USING "btree" ("quote_id");



CREATE INDEX "idx_quote_attachments_request_id" ON "public"."quote_attachments" USING "btree" ("request_id");



CREATE INDEX "idx_requests_invoice_id" ON "public"."requests" USING "btree" ("invoice_id");



CREATE INDEX "idx_requests_lat_lng" ON "public"."requests" USING "btree" ("latitude", "longitude");



CREATE INDEX "idx_requests_latitude" ON "public"."requests" USING "btree" ("latitude");



CREATE INDEX "idx_requests_longitude" ON "public"."requests" USING "btree" ("longitude");



CREATE INDEX "idx_user_profiles_coordinates" ON "public"."user_profiles" USING "btree" ("latitude", "longitude");



CREATE INDEX "requests_created_at_idx" ON "public"."requests" USING "btree" ("created_at" DESC);



CREATE OR REPLACE TRIGGER "on_profile_role_change" AFTER INSERT OR UPDATE OF "role" ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_role_from_profile"();



CREATE OR REPLACE TRIGGER "on_public_requests_updated" BEFORE UPDATE ON "public"."requests" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "trg_set_quote_number" BEFORE INSERT ON "public"."quotes" FOR EACH ROW EXECUTE FUNCTION "public"."set_quote_number"();



CREATE OR REPLACE TRIGGER "trigger_sync_invoice_status" AFTER INSERT OR UPDATE OF "status" ON "public"."invoices" FOR EACH ROW EXECUTE FUNCTION "public"."sync_invoice_status_to_request"();



COMMENT ON TRIGGER "trigger_sync_invoice_status" ON "public"."invoices" IS 'Syncs invoice status changes to associated request status';



CREATE OR REPLACE TRIGGER "update_requests_updated_at" BEFORE UPDATE ON "public"."requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_requests_updated_at_column"();



ALTER TABLE ONLY "public"."requests"
    ADD CONSTRAINT "fk_requests_invoice" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."quote_attachments"
    ADD CONSTRAINT "quote_attachments_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quote_attachments"
    ADD CONSTRAINT "quote_attachments_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quotes"
    ADD CONSTRAINT "quotes_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."quotes"
    ADD CONSTRAINT "quotes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."request_notes"
    ADD CONSTRAINT "request_notes_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."request_notes"
    ADD CONSTRAINT "request_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."requests"
    ADD CONSTRAINT "requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("user_id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Enable all actions for admins" ON "public"."invoices" USING ("public"."is_admin"());



CREATE POLICY "Enable all actions for admins" ON "public"."quotes" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Enable all actions for admins" ON "public"."request_notes" USING ("public"."is_admin"());



CREATE POLICY "Enable all actions for request owners" ON "public"."request_notes" USING ((("auth"."uid"() = ( SELECT "requests"."user_id"
   FROM "public"."requests"
  WHERE ("requests"."id" = "request_notes"."request_id"))) OR "public"."is_admin"()));



CREATE POLICY "Enable delete for admins" ON "public"."quote_attachments" FOR DELETE USING ("public"."is_admin"());



CREATE POLICY "Enable delete for admins" ON "public"."requests" FOR DELETE USING ("public"."is_admin"());



CREATE POLICY "Enable delete for admins" ON "public"."user_profiles" FOR DELETE USING ("public"."is_admin"());



CREATE POLICY "Enable insert for own profile" ON "public"."user_profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable insert for own request" ON "public"."requests" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable insert for owners" ON "public"."quote_attachments" FOR INSERT WITH CHECK (("auth"."uid"() = ( SELECT "requests"."user_id"
   FROM "public"."requests"
  WHERE ("requests"."id" = "quote_attachments"."request_id"))));



CREATE POLICY "Enable read for admins and owners" ON "public"."requests" FOR SELECT USING ((("auth"."uid"() = "user_id") OR "public"."is_admin"()));



CREATE POLICY "Enable read for own invoices" ON "public"."invoices" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable read for request owners" ON "public"."quote_attachments" FOR SELECT USING ((("auth"."uid"() = ( SELECT "requests"."user_id"
   FROM "public"."requests"
  WHERE ("requests"."id" = "quote_attachments"."request_id"))) OR "public"."is_admin"()));



CREATE POLICY "Enable read for request owners" ON "public"."quotes" FOR SELECT USING (("auth"."uid"() = ( SELECT "requests"."user_id"
   FROM "public"."requests"
  WHERE ("requests"."id" = "quotes"."request_id"))));



CREATE POLICY "Enable read for users and admins" ON "public"."user_profiles" FOR SELECT USING ((("auth"."uid"() = "user_id") OR "public"."is_admin"()));



CREATE POLICY "Enable update for users and admins" ON "public"."requests" FOR UPDATE USING ((("auth"."uid"() = "user_id") OR "public"."is_admin"()));



CREATE POLICY "Enable update for users and admins" ON "public"."user_profiles" FOR UPDATE USING ((("auth"."uid"() = "user_id") OR "public"."is_admin"()));



ALTER TABLE "public"."invoices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quote_attachments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quotes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."request_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."quote_attachments";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."quotes";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."request_notes";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."requests";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."accept_quote_and_update_request"("p_request_id" "uuid", "p_quote_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."accept_quote_and_update_request"("p_request_id" "uuid", "p_quote_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_quote_and_update_request"("p_request_id" "uuid", "p_quote_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."bytea_to_text"("data" "bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."bytea_to_text"("data" "bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."bytea_to_text"("data" "bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."bytea_to_text"("data" "bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_user_data"("target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_user_data"("target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_user_data"("target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."http"("request" "public"."http_request") TO "postgres";
GRANT ALL ON FUNCTION "public"."http"("request" "public"."http_request") TO "anon";
GRANT ALL ON FUNCTION "public"."http"("request" "public"."http_request") TO "authenticated";
GRANT ALL ON FUNCTION "public"."http"("request" "public"."http_request") TO "service_role";



GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying, "content" character varying, "content_type" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying, "content" character varying, "content_type" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying, "content" character varying, "content_type" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying, "content" character varying, "content_type" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying, "data" "jsonb") TO "postgres";
GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying, "data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying, "data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying, "data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."http_head"("uri" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_head"("uri" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_head"("uri" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_head"("uri" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."http_header"("field" character varying, "value" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_header"("field" character varying, "value" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_header"("field" character varying, "value" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_header"("field" character varying, "value" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."http_list_curlopt"() TO "postgres";
GRANT ALL ON FUNCTION "public"."http_list_curlopt"() TO "anon";
GRANT ALL ON FUNCTION "public"."http_list_curlopt"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_list_curlopt"() TO "service_role";



GRANT ALL ON FUNCTION "public"."http_patch"("uri" character varying, "content" character varying, "content_type" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_patch"("uri" character varying, "content" character varying, "content_type" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_patch"("uri" character varying, "content" character varying, "content_type" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_patch"("uri" character varying, "content" character varying, "content_type" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "data" "jsonb") TO "postgres";
GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "content" character varying, "content_type" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "content" character varying, "content_type" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "content" character varying, "content_type" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "content" character varying, "content_type" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."http_put"("uri" character varying, "content" character varying, "content_type" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_put"("uri" character varying, "content" character varying, "content_type" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_put"("uri" character varying, "content" character varying, "content_type" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_put"("uri" character varying, "content" character varying, "content_type" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."http_reset_curlopt"() TO "postgres";
GRANT ALL ON FUNCTION "public"."http_reset_curlopt"() TO "anon";
GRANT ALL ON FUNCTION "public"."http_reset_curlopt"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_reset_curlopt"() TO "service_role";



GRANT ALL ON FUNCTION "public"."http_set_curlopt"("curlopt" character varying, "value" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_set_curlopt"("curlopt" character varying, "value" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_set_curlopt"("curlopt" character varying, "value" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_set_curlopt"("curlopt" character varying, "value" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_quote_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_quote_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_quote_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_invoice_status_to_request"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_invoice_status_to_request"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_invoice_status_to_request"() TO "service_role";



GRANT ALL ON FUNCTION "public"."text_to_bytea"("data" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."text_to_bytea"("data" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."text_to_bytea"("data" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."text_to_bytea"("data" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_requests_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_requests_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_requests_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_role_from_profile"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_role_from_profile"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_role_from_profile"() TO "service_role";



GRANT ALL ON FUNCTION "public"."urlencode"("string" "bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."urlencode"("string" "bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."urlencode"("string" "bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."urlencode"("string" "bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."urlencode"("data" "jsonb") TO "postgres";
GRANT ALL ON FUNCTION "public"."urlencode"("data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."urlencode"("data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."urlencode"("data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."urlencode"("string" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."urlencode"("string" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."urlencode"("string" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."urlencode"("string" character varying) TO "service_role";


















GRANT ALL ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";



GRANT ALL ON TABLE "public"."quote_attachments" TO "anon";
GRANT ALL ON TABLE "public"."quote_attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."quote_attachments" TO "service_role";



GRANT ALL ON TABLE "public"."quotes" TO "anon";
GRANT ALL ON TABLE "public"."quotes" TO "authenticated";
GRANT ALL ON TABLE "public"."quotes" TO "service_role";



GRANT ALL ON TABLE "public"."request_notes" TO "anon";
GRANT ALL ON TABLE "public"."request_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."request_notes" TO "service_role";



GRANT ALL ON TABLE "public"."requests" TO "anon";
GRANT ALL ON TABLE "public"."requests" TO "authenticated";
GRANT ALL ON TABLE "public"."requests" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
