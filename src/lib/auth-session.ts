export function clerkSessionView<T>(
  clerkReady: boolean,
  activeUserId: string | null,
  loadedFor: string | null,
  profile: T | null,
) {
  const current = activeUserId != null && loadedFor === activeUserId;
  const visible = current ? profile : null;
  return {
    profile: visible,
    isLoading: !clerkReady || (activeUserId != null && !current),
  };
}
