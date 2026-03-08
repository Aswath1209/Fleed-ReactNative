-- Allow anyone to read basic user profiles for the leaderboard
create policy "Anyone can view user profiles" on public.users
for select using (true);
