begin;
select plan(3);
select has_function('public', 'create_booking_hold', 'booking hold function exists');
select has_function('public', 'reconcile_vilara', 'reconciliation function exists');
select col_is_pk('public', 'bookings', 'id', 'bookings has a primary key');
select * from finish();
rollback;

