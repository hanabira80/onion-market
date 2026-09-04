-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS onion_market;

-- 2. Grant Permissions
GRANT USAGE ON SCHEMA onion_market TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA onion_market TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA onion_market TO anon, authenticated, service_role;

-- 3. Auto Inherit Permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA onion_market GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA onion_market GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- 4. Tables (JSON store shape → Postgres)
CREATE TABLE IF NOT EXISTS onion_market.students (
  student_id text PRIMARY KEY,
  name text NOT NULL,
  grade integer NOT NULL,
  class_number integer NOT NULL,
  student_number integer NOT NULL,
  role text NOT NULL CHECK (role IN ('student', 'admin')),
  password_hash text,
  points_balance integer NOT NULL DEFAULT 0 CHECK (points_balance >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS onion_market.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  image_url text,
  condition text NOT NULL CHECK (condition IN ('good', 'fair', 'poor')),
  sale_status text NOT NULL CHECK (sale_status IN ('on_sale', 'reserved', 'done')),
  points integer NOT NULL CHECK (points >= 1),
  quantity integer NOT NULL CHECK (quantity >= 0),
  category text NOT NULL CHECK (category IN ('stationery', 'supplies', 'fashion', 'other')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS onion_market.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text NOT NULL REFERENCES onion_market.students (student_id),
  product_id uuid REFERENCES onion_market.products (id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_image_url text,
  points integer NOT NULL CHECK (points >= 1),
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity = 1),
  status text NOT NULL CHECK (status IN ('awaiting_pickup', 'completed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS onion_market.wishlist (
  student_id text NOT NULL REFERENCES onion_market.students (student_id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES onion_market.products (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, product_id)
);

CREATE TABLE IF NOT EXISTS onion_market.point_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text NOT NULL REFERENCES onion_market.students (student_id) ON DELETE CASCADE,
  amount integer NOT NULL,
  memo text NOT NULL,
  granted_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_student_id_idx ON onion_market.orders (student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_idx ON onion_market.orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS wishlist_student_id_idx ON onion_market.wishlist (student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS point_ledger_created_at_idx ON onion_market.point_ledger (created_at DESC);

ALTER TABLE onion_market.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE onion_market.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE onion_market.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE onion_market.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE onion_market.point_ledger ENABLE ROW LEVEL SECURITY;

-- 5. Atomic shop RPCs (first click wins)
CREATE OR REPLACE FUNCTION onion_market.purchase_product(
  p_student_id text,
  p_product_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = onion_market
AS $$
DECLARE
  v_product onion_market.products%ROWTYPE;
  v_student onion_market.students%ROWTYPE;
  v_order onion_market.orders%ROWTYPE;
  v_now timestamptz := now();
BEGIN
  SELECT * INTO v_product FROM onion_market.products WHERE id = p_product_id FOR UPDATE;
  SELECT * INTO v_student FROM onion_market.students WHERE student_id = p_student_id FOR UPDATE;

  IF v_product.id IS NULL OR v_student.student_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_found', 'error', '상품을 찾지 못했어요.');
  END IF;

  IF v_product.quantity <= 0 OR v_product.sale_status = 'done' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'sold_out', 'error', '방금 다른 친구가 사서 품절이에요.');
  END IF;

  IF v_product.sale_status <> 'on_sale' THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'not_on_sale',
      'error', CASE
        WHEN v_product.sale_status = 'reserved' THEN '지금은 예약 중이라 살 수 없어요.'
        ELSE '지금은 살 수 없어요.'
      END
    );
  END IF;

  IF v_student.points_balance < v_product.points THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'insufficient',
      'error', format('포인트가 부족해요. 지금 잔액은 %sP예요.', v_student.points_balance)
    );
  END IF;

  UPDATE onion_market.products
  SET
    quantity = quantity - 1,
    sale_status = CASE WHEN quantity - 1 = 0 THEN 'done' ELSE sale_status END,
    updated_at = v_now
  WHERE id = p_product_id
  RETURNING * INTO v_product;

  UPDATE onion_market.students
  SET points_balance = points_balance - v_product.points
  WHERE student_id = p_student_id
  RETURNING * INTO v_student;

  INSERT INTO onion_market.orders (
    student_id, product_id, product_name, product_image_url, points, quantity, status, created_at
  ) VALUES (
    p_student_id, p_product_id, v_product.name, v_product.image_url, v_product.points, 1, 'awaiting_pickup', v_now
  )
  RETURNING * INTO v_order;

  INSERT INTO onion_market.point_ledger (student_id, amount, memo, granted_by, created_at)
  VALUES (p_student_id, -v_product.points, format('구매: %s', v_product.name), p_student_id, v_now);

  RETURN jsonb_build_object(
    'ok', true,
    'remaining_points', v_student.points_balance,
    'remaining_quantity', v_product.quantity,
    'order', jsonb_build_object(
      'id', v_order.id,
      'student_id', v_order.student_id,
      'product_id', v_order.product_id,
      'product_name', v_order.product_name,
      'product_image_url', v_order.product_image_url,
      'points', v_order.points,
      'quantity', v_order.quantity,
      'status', v_order.status,
      'created_at', v_order.created_at
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION onion_market.cancel_order(
  p_student_id text,
  p_order_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = onion_market
AS $$
DECLARE
  v_order onion_market.orders%ROWTYPE;
  v_student onion_market.students%ROWTYPE;
  v_product onion_market.products%ROWTYPE;
  v_now timestamptz := now();
BEGIN
  SELECT * INTO v_order FROM onion_market.orders WHERE id = p_order_id FOR UPDATE;

  IF v_order.id IS NULL OR v_order.student_id <> p_student_id THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_found', 'error', '주문을 찾지 못했어요.');
  END IF;

  IF v_order.status = 'completed' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_cancellable', 'error', '이미 받아서 취소할 수 없어요.');
  END IF;

  IF v_order.status <> 'awaiting_pickup' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_cancellable', 'error', '이미 취소한 주문이에요.');
  END IF;

  SELECT * INTO v_student FROM onion_market.students WHERE student_id = p_student_id FOR UPDATE;

  IF v_student.student_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_found', 'error', '주문을 찾지 못했어요.');
  END IF;

  UPDATE onion_market.students
  SET points_balance = points_balance + v_order.points
  WHERE student_id = p_student_id
  RETURNING * INTO v_student;

  UPDATE onion_market.orders
  SET status = 'cancelled'
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  IF v_order.product_id IS NOT NULL THEN
    SELECT * INTO v_product FROM onion_market.products WHERE id = v_order.product_id FOR UPDATE;
    IF v_product.id IS NOT NULL THEN
      UPDATE onion_market.products
      SET
        quantity = quantity + v_order.quantity,
        sale_status = CASE
          WHEN sale_status = 'done' AND quantity = 0 THEN 'on_sale'
          ELSE sale_status
        END,
        updated_at = v_now
      WHERE id = v_product.id;
    END IF;
  END IF;

  INSERT INTO onion_market.point_ledger (student_id, amount, memo, granted_by, created_at)
  VALUES (p_student_id, v_order.points, format('취소: %s', v_order.product_name), p_student_id, v_now);

  RETURN jsonb_build_object(
    'ok', true,
    'remaining_points', v_student.points_balance,
    'product_id', v_order.product_id,
    'order', jsonb_build_object(
      'id', v_order.id,
      'student_id', v_order.student_id,
      'product_id', v_order.product_id,
      'product_name', v_order.product_name,
      'product_image_url', v_order.product_image_url,
      'points', v_order.points,
      'quantity', v_order.quantity,
      'status', v_order.status,
      'created_at', v_order.created_at
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION onion_market.complete_order(
  p_order_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = onion_market
AS $$
DECLARE
  v_order onion_market.orders%ROWTYPE;
BEGIN
  SELECT * INTO v_order FROM onion_market.orders WHERE id = p_order_id FOR UPDATE;

  IF v_order.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_found', 'error', '주문을 찾지 못했어요.');
  END IF;

  IF v_order.status = 'cancelled' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_completable', 'error', '취소된 주문은 수령 처리할 수 없어요.');
  END IF;

  IF v_order.status <> 'awaiting_pickup' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_completable', 'error', '이미 수령 완료예요.');
  END IF;

  UPDATE onion_market.orders
  SET status = 'completed'
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  RETURN jsonb_build_object(
    'ok', true,
    'order', jsonb_build_object(
      'id', v_order.id,
      'student_id', v_order.student_id,
      'product_id', v_order.product_id,
      'product_name', v_order.product_name,
      'product_image_url', v_order.product_image_url,
      'points', v_order.points,
      'quantity', v_order.quantity,
      'status', v_order.status,
      'created_at', v_order.created_at
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION onion_market.grant_points(
  p_student_ids text[],
  p_amount integer,
  p_memo text,
  p_granted_by text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = onion_market
AS $$
DECLARE
  v_id text;
  v_found text[] := ARRAY[]::text[];
  v_missing text[] := ARRAY[]::text[];
  v_now timestamptz := now();
BEGIN
  FOREACH v_id IN ARRAY p_student_ids
  LOOP
    UPDATE onion_market.students
    SET points_balance = points_balance + p_amount
    WHERE student_id = v_id;

    IF FOUND THEN
      v_found := array_append(v_found, v_id);
      INSERT INTO onion_market.point_ledger (student_id, amount, memo, granted_by, created_at)
      VALUES (v_id, p_amount, p_memo, p_granted_by, v_now);
    ELSE
      v_missing := array_append(v_missing, v_id);
    END IF;
  END LOOP;

  RETURN jsonb_build_object('found', to_jsonb(v_found), 'missing', to_jsonb(v_missing));
END;
$$;

REVOKE ALL ON FUNCTION onion_market.purchase_product(text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION onion_market.cancel_order(text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION onion_market.complete_order(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION onion_market.grant_points(text[], integer, text, text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION onion_market.purchase_product(text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION onion_market.cancel_order(text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION onion_market.complete_order(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION onion_market.grant_points(text[], integer, text, text) TO service_role;

-- 6. Product photo bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "product_images_public_read" ON storage.objects;
CREATE POLICY "product_images_public_read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_service_insert" ON storage.objects;
CREATE POLICY "product_images_service_insert"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_service_update" ON storage.objects;
CREATE POLICY "product_images_service_update"
ON storage.objects
FOR UPDATE
TO service_role
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');
