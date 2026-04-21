import { create } from 'zustand';

export type IssueStatus = 'open' | 'resolved' | 'archived';

export interface MessageAttachment {
  id: string;
  original_name: string;
  content_type: string;
  file_size: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  attachments?: MessageAttachment[];
}

export interface Issue {
  id: string;
  title: string;
  status: IssueStatus;
  created_at: string;
  messages?: Message[];
  message_count?: number;
  last_message_at?: string | null;
  resolved_at?: string | null;
}

interface IssueState {
  issues: Issue[];
  activeIssue: Issue | null;
  setIssues: (issues: Issue[]) => void;
  setActiveIssue: (issue: Issue | null) => void;
  appendMessage: (issueId: string, message: Message) => void;
  updateStreamingContent: (issueId: string, content: string) => void;
}

function patchIssueMessages(issue: Issue, issueId: string, fn: (messages: Message[]) => Message[]): Issue {
  if (issue.id !== issueId) return issue;
  const messages = fn([...(issue.messages ?? [])]);
  return { ...issue, messages };
}

export const useIssueStore = create<IssueState>((set) => ({
  issues: [],
  activeIssue: null,
  setIssues: (issues) => set({ issues }),
  setActiveIssue: (activeIssue) => set({ activeIssue }),
  appendMessage: (issueId, message) =>
    set((state) => ({
      issues: state.issues.map((i) =>
        i.id === issueId
          ? { ...i, messages: [...(i.messages ?? []), message] }
          : i,
      ),
      activeIssue: state.activeIssue
        ? patchIssueMessages(state.activeIssue, issueId, (m) => [...m, message])
        : null,
    })),
  updateStreamingContent: (issueId, content) =>
    set((state) => ({
      issues: state.issues.map((i) =>
        patchIssueMessages(i, issueId, (messages) => {
          if (!messages.length) return messages;
          const lastIdx = messages.length - 1;
          const last = messages[lastIdx];
          if (last?.role !== 'assistant') return messages;
          const next = [...messages];
          next[lastIdx] = { ...last, content };
          return next;
        }),
      ),
      activeIssue: state.activeIssue
        ? patchIssueMessages(state.activeIssue, issueId, (messages) => {
            if (!messages.length) return messages;
            const lastIdx = messages.length - 1;
            const last = messages[lastIdx];
            if (last?.role !== 'assistant') return messages;
            const next = [...messages];
            next[lastIdx] = { ...last, content };
            return next;
          })
        : null,
    })),
}));
