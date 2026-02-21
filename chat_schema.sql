-- Drop existing tables if they exist
drop table if exists messages;
drop table if exists rooms;

-- Create rooms table
create table rooms (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  user_id_1 uuid references auth.users not null,
  user_id_2 uuid references auth.users not null
);

-- Create messages table
create table messages (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  room_id uuid references rooms(id) on delete cascade not null,
  sender_id uuid references auth.users not null,
  text text not null
);

-- Enable Row Level Security
alter table rooms enable row level security;
alter table messages enable row level security;

-- Policies for rooms
create policy "Users can view their own rooms"
  on rooms for select
  using (auth.uid() = user_id_1 or auth.uid() = user_id_2);

create policy "Users can create rooms"
  on rooms for insert
  with check (auth.uid() = user_id_1 or auth.uid() = user_id_2);

-- Policies for messages
create policy "Users can view messages in their rooms"
  on messages for select
  using (
    exists (
      select 1 from rooms
      where rooms.id = messages.room_id
      and (rooms.user_id_1 = auth.uid() or rooms.user_id_2 = auth.uid())
    )
  );

create policy "Users can insert messages in their rooms"
  on messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from rooms
      where rooms.id = messages.room_id
      and (rooms.user_id_1 = auth.uid() or rooms.user_id_2 = auth.uid())
    )
  );
