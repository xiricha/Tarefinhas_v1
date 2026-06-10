# Backend actions

The MVP UI is local-first, but the domain is shaped around these production actions:

- `create_task`: saves a task, defaulting missing `project_id` to Inbox semantics.
- `quick_add_parse`: returns title plus recognized chips for date, time, recurrence, label, project, reminder, assignee, and attachments.
- `update_task`: patches metadata and increments `version` for conflict detection.
- `complete_task`: completes active tasks and calls `generate_recurring_instance` when a recurrence rule exists.
- `reschedule_task`: updates `due_date`/`due_time` from Today, Upcoming, notifications, or drag-and-drop.
- `create_project`: creates projects, sections, hierarchy, favorites, and template-derived metadata.
- `create_filter`: stores both `query_text` and visual `visual_config`.
- `attach_file`: uploads a file and creates an attachment row during task creation or detail editing.
- `add_comment`: adds collaborative task comments and emits mention notifications.
- `assign_task`: validates project membership and emits assignment notifications.
- `generate_recurring_instance`: supports schedule-based and completion-based recurrence modes.
- `search_everything`: searches tasks, descriptions, comments, projects, labels, and attachment names.

Offline-first behavior is handled by writing optimistic UI changes locally, enqueuing the action in `sync_queue`, and resolving conflicts by `version` plus `activity_logs` audit entries.
