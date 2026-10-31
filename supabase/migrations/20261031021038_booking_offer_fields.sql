-- Bookings made through an offer remember which deal it was and what the visit would normally have cost.
-- total_price stays the amount the client pays.
alter table public.bookings
  add column if not exists offer_name text check (offer_name is null or char_length(offer_name) <= 80),
  add column if not exists usual_price integer check (usual_price is null or usual_price >= 0);
