// Global TypeScript Types for Resume Customizer App

export type AppView = "onboarding" | "auth" | "overview" | "tailor" | "history" | "profile";

export interface UserProfile {
  fullName: string;
  avatarUrl: string;
  collectionsCount: number;
  followersCount: string;
  engagementRate: string;
  archivedCount: string;
}

export interface TailoringSession {
  id: string;
  date: string;
  jobDescription: string;
  resume: string;
  summary: string;
  bullets: string;
  keywordGaps: string;
  timeMs: number;
  matchScore: number;
  jobTitle: string;
  companyName: string;
}

export interface KeywordGap {
  word: string;
  type: "GENUINE GAP" | "REPHRASE OPPORTUNITY";
}
