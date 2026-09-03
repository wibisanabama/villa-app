insert into public.subscription_plans(slug, name, description, price, villa_limit, staff_limit, features, is_popular)
values
  ('starter', 'Starter', 'Untuk memulai pengelolaan satu properti.', 0, 1, 0,
    '["1 villa", "Pemesanan langsung", "Analitik dasar"]'::jsonb, false),
  ('professional', 'Professional', 'Untuk pengelola villa yang sedang berkembang.', 149000, 5, 10,
    '["5 villa", "10 staf", "Kalender operasional", "Analitik lengkap"]'::jsonb, true),
  ('enterprise', 'Enterprise', 'Untuk portofolio properti tanpa batas.', 399000, null, null,
    '["Villa tanpa batas", "Staf tanpa batas", "Kalender operasional", "Analitik lengkap"]'::jsonb, false)
on conflict (slug) do update set name = excluded.name, description = excluded.description,
  price = excluded.price, villa_limit = excluded.villa_limit, staff_limit = excluded.staff_limit,
  features = excluded.features, is_popular = excluded.is_popular, is_active = true;

