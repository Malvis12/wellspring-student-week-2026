# QA Smoke Checklist

## Voting Page

- [ ] Page loads online and offline banner behaves correctly.
- [ ] Candidate cards render and category filter works.
- [ ] Vote count visibility respects `settings/status.voteCountVisible`.
- [ ] Paystack checkout opens and success callback triggers.
- [ ] Secure vote endpoint returns success and vote count increments.
- [ ] Duplicate callback with same reference does not double-count votes.

## Admin Login

- [ ] Admin login redirects to dashboard.
- [ ] Invalid login shows error message.

## Admin Dashboard

- [ ] Categories CRUD works.
- [ ] Candidates CRUD works.
- [ ] Settings save works for vote price, voting status, vote count visibility.
- [ ] Recent transactions table loads and updates in real time.

## Security

- [ ] Firestore rules deployed.
- [ ] Unauthenticated write to `settings` fails.
- [ ] Client-side direct vote increment write fails (expected after hardening).
- [ ] Cloud Function verifies Paystack and writes vote transaction.

## Performance / UX

- [ ] Mobile layout for index and dashboard is usable.
- [ ] No blocking console errors in happy path.
