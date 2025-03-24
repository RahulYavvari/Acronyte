export type Page =
  | "acronym"
  | "leaderboard";

export type WebviewToBlockMessage = { type: "INIT" } | {
  type: "GET_LEADERBOARD_REQUEST";
  // payload: { name: string };
};

export type BlocksToWebviewMessage = {
  type: "INIT_RESPONSE";
  payload: {
    acronym: string;
  };
} | {
  type: "GET_LEADERBOARD_RESPONSE";
  payload: { author: string; score: number; rank: number; text: string }[];
};

export type DevvitMessage = {
  type: "devvit-message";
  data: { message: BlocksToWebviewMessage };
};
