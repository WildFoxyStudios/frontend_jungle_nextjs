import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";

// Mock dependencies
vi.mock("@jungle/hooks", () => ({
 useFeed: vi.fn(() => ({
 data: {
 pages: [
 {
 data: [
 {
 id: 1,
 user_id: 1,
 content: "This is a test post",
 comment_count: 0,
 like_count: 5,
 share_count: 1,
 view_count: 100,
 created_at: new Date().toISOString(),
 privacy: "public",
 reaction_counts: { like: 5 },
 publisher: {
 id: 1,
 username: "testuser",
 first_name: "Test",
 last_name: "User",
 avatar: "test.jpg",
 is_verified: true,
 is_pro: 1,
 is_online: true,
 }
 }
 ]
 }
 ]
 },
 fetchNextPage: vi.fn(),
 hasNextPage: false,
 isFetchingNextPage: false,
 refetch: vi.fn()
 })),
 useIntersection: vi.fn(() => [{ current: null }, false]),
 useRealtimeStore: vi.fn((selector?: (s: unknown) => unknown) => {
 const state = {
 on: vi.fn(() => vi.fn()),
 send: vi.fn(),
 newPostsCount: { home: 0, group: {}, page: {} },
 typingUsers: new Map(),
 unreadMessages: 0,
 unreadNotifications: 0,
 resetNewPosts: vi.fn(),
 };
 return typeof selector === "function" ? selector(state) : state;
 }),
 useAuthStore: vi.fn(() => ({
 user: { id: 1, username: "testuser" },
 })),
 useNewPostsCount: vi.fn(() => 0),
 useSubscribe: vi.fn(),
 useRealtimeEvent: vi.fn(),
 useOnlineUsers: vi.fn(() => new Set<number>()),
 useProfileSnapshot: vi.fn(() => ({})),
 usePublicConfig: vi.fn(() => ({
 websiteMode: "social",
 config: null,
 loading: false,
 })),
}));

vi.mock("next-intl", () => ({
 useTranslations: vi.fn(() => (key: string) => key)
}));

// We must import the component AFTER mocking
import FeedPage from "../app/(main)/feed/page";

describe("FeedPage functional parity", () => {
 beforeEach(() => {
 vi.clearAllMocks();
 });

 it("renders the feed layout successfully", async () => {
 render(<FeedPage />);
 
 // Verify standard UI elements are loaded
 await waitFor(() => {
 expect(screen.getByText("This is a test post")).toBeInTheDocument();
 expect(screen.getByText("Test User")).toBeInTheDocument();
 });
 });
});
