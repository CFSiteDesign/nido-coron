-- Set when the booking confirmation emails have gone out, so a payment reported
-- more than once only emails people once.
alter table public.expedition_bookings
  add column booking_emails_sent_at timestamptz;

-- Bookings already paid before emails existed don't get them retroactively.
update public.expedition_bookings
  set booking_emails_sent_at = now()
  where status = 'paid';