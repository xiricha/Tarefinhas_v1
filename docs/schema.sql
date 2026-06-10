-- Initial production-oriented schema for Tarefinhas.
-- It extends the supplied MVP schema with offline sync, notifications, widgets,
-- smart suggestions, memberships, and indexes used by the app shell.

create table users (
  id uuid primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

create table workspaces (
  id uuid primary key,
  owner_id uuid references users(id),
  name text not null,
  created_at timestamptz default now()
);

create table workspace_members (
  workspace_id uuid references workspaces(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz default now(),
  primary key (workspace_id, user_id)
);

create table projects (
  id uuid primary key,
  workspace_id uuid references workspaces(id),
  parent_project_id uuid references projects(id),
  name text not null,
  color text,
  icon text,
  is_archived boolean default false,
  is_favorite boolean default false,
  position numeric,
  created_at timestamptz default now()
);

create table sections (
  id uuid primary key,
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  position numeric,
  created_at timestamptz default now()
);

create table labels (
  id uuid primary key,
  workspace_id uuid references workspaces(id),
  name text not null,
  color text,
  position numeric,
  created_at timestamptz default now()
);

create table tasks (
  id uuid primary key,
  workspace_id uuid references workspaces(id),
  project_id uuid references projects(id),
  section_id uuid references sections(id),
  parent_task_id uuid references tasks(id),
  creator_id uuid references users(id),
  assignee_id uuid references users(id),
  title text not null,
  description_rich jsonb,
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  priority int default 4 check (priority between 1 and 4),
  due_date date,
  due_time time,
  deadline_date date,
  recurrence_rule text,
  recurrence_mode text check (recurrence_mode in ('schedule', 'completion')),
  source_type text,
  source_payload jsonb,
  energy_estimate text,
  duration_estimate_minutes int,
  custom_fields jsonb,
  order_index numeric,
  version int not null default 1,
  is_archived boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  completed_at timestamptz
);

create table task_labels (
  task_id uuid references tasks(id) on delete cascade,
  label_id uuid references labels(id) on delete cascade,
  primary key (task_id, label_id)
);

create table reminders (
  id uuid primary key,
  task_id uuid references tasks(id) on delete cascade,
  reminder_type text not null,
  remind_at timestamptz,
  relative_rule text,
  location_payload jsonb,
  created_at timestamptz default now()
);

create table comments (
  id uuid primary key,
  task_id uuid references tasks(id) on delete cascade,
  user_id uuid references users(id),
  body text not null,
  created_at timestamptz default now()
);

create table attachments (
  id uuid primary key,
  task_id uuid references tasks(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  mime_type text,
  file_size bigint,
  source_payload jsonb,
  created_at timestamptz default now()
);

create table filters (
  id uuid primary key,
  workspace_id uuid references workspaces(id),
  name text not null,
  color text,
  query_text text,
  visual_config jsonb,
  is_favorite boolean default false,
  position numeric,
  created_at timestamptz default now()
);

create table notifications (
  id uuid primary key,
  workspace_id uuid references workspaces(id),
  user_id uuid references users(id),
  task_id uuid references tasks(id) on delete cascade,
  notification_type text not null,
  payload jsonb,
  read_at timestamptz,
  created_at timestamptz default now()
);

create table widget_configs (
  id uuid primary key,
  user_id uuid references users(id),
  widget_type text not null,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create table smart_suggestions (
  id uuid primary key,
  workspace_id uuid references workspaces(id),
  task_id uuid references tasks(id) on delete cascade,
  suggestion_type text not null,
  payload jsonb not null,
  accepted_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz default now()
);

create table activity_logs (
  id uuid primary key,
  task_id uuid references tasks(id) on delete cascade,
  actor_id uuid references users(id),
  action_type text not null,
  payload jsonb,
  created_at timestamptz default now()
);

create table sync_queue (
  id uuid primary key,
  workspace_id uuid references workspaces(id),
  actor_id uuid references users(id),
  action_name text not null,
  payload jsonb not null,
  conflict_key text,
  processed_at timestamptz,
  created_at timestamptz default now()
);

create index tasks_today_idx on tasks (workspace_id, due_date, status);
create index tasks_inbox_idx on tasks (workspace_id, created_at desc) where project_id is null and status = 'active';
create index tasks_search_idx on tasks using gin (to_tsvector('portuguese', title));
create index activity_task_idx on activity_logs (task_id, created_at desc);
