  import { RedditAPIClient } from "@devvit/public-api";
  import { LeaderboardService } from "./LeaderboardService.js";

  export interface CustomComment {
    commentId: string;
    text: string;
    score: number;
    authorId: string;
    authorName: string;
  }

  export type FetchComments = (postid: string, redditAPI: RedditAPIClient) => Promise<CustomComment[]>;

  export class AdaptivePoller {
    private fetchComments: FetchComments;
    private postId: string;
    private redditAPI: RedditAPIClient;
    private creationTime: number;
    private baseInterval: number;
    private multiplier: number;
    private pollCount: number;
    private nextPollTimeout: NodeJS.Timeout | null;
    private leaderboardService: LeaderboardService;
    private active: boolean;
    private lastPollTime: number;
    private trackedCommentIds: Set<string>;

    constructor(
        fetchComments: FetchComments,
        leaderboardService: LeaderboardService,
        creationTime: Date,
        postId: string,
        redditAPI: RedditAPIClient,
        baseInterval: number = 10_000,
        multiplier: number = 2
    ) {
        this.fetchComments = fetchComments;
        this.leaderboardService = leaderboardService;
        this.creationTime = creationTime.getTime();
        this.postId = postId;
        this.redditAPI = redditAPI;
        this.baseInterval = baseInterval;
        this.multiplier = multiplier;
        this.pollCount = 0;
        this.nextPollTimeout = null;
        this.active = false;
        this.lastPollTime = 0;
        this.trackedCommentIds = new Set();
    }

    public start() {
        if (this.active) return;
        this.active = true;
        // this.scheduleNextPoll();
    } 

    public stop() {
        this.active = false;
        if (this.nextPollTimeout) {
            clearTimeout(this.nextPollTimeout);
        }
        this.nextPollTimeout = null;
    }

    private async scheduleNextPoll() {
        if (!this.active) return;

        const now = Date.now();
        const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;
        const elapsed = now - this.creationTime;

        if (elapsed >= FORTY_EIGHT_HOURS) {
            await this.pollOnce();
            this.stop();
            return;
        }

        const nextDelay = this.baseInterval * Math.pow(this.multiplier, this.pollCount);
        const maxDelay = FORTY_EIGHT_HOURS - elapsed;
        const actualDelay = Math.min(nextDelay, maxDelay);
        console.log("scheduling");
        await this.pollOnce();
        // this.nextPollTimeout = setTimeout(async () => {
        //     this.lastPollTime = Date.now();
        //     console.log("polling once...");
        //     await this.pollOnce();

        //     this.pollCount++;
        //     this.scheduleNextPoll();
        // }, actualDelay);
    }

    private async pollOnce() {
      if (!this.active) return;
      console.log("Poll Once, active:", this.active);
        try {
            const newComments = await this.fetchComments(this.postId, this.redditAPI);
            console.log("[FETCHED]",newComments);
            await this.updateComments(newComments);
        } catch (error) {
            console.error("Polling error:", error);
        }
    }

    private async updateComments(newComments: CustomComment[]) {
        const leaderboardId = `leaderboard:${this.postId}`;
        const newCommentIds = new Set(newComments.map(comment => comment.commentId));

        // Check if leaderboard exists; if not, create it only once
        const leaderboardExists = await this.leaderboardService.exists(leaderboardId);
        if (!leaderboardExists) {
            await this.leaderboardService.createLeaderboard(leaderboardId, `Leaderboard for post ${this.postId}`);
        }

        // Process each comment to add or update the corresponding author on the leaderboard
        for (const newComment of newComments) {
            const existingScore = await this.leaderboardService.getMemberScore(leaderboardId, newComment.commentId);
            console.log(existingScore);
            if (existingScore === undefined) {
                await this.leaderboardService.addOrUpdateMember(leaderboardId, newComment.commentId, newComment.score);
                console.log(`Added comment to leaderboard: ${newComment.commentId}`);
            } else if (existingScore !== newComment.score) {
                await this.leaderboardService.addOrUpdateMember(leaderboardId, newComment.commentId, newComment.score);
                console.log(`Updated comment score in leaderboard: ${newComment.commentId}`);
            }
        }

        // Handle deleted comments (for logging purposes)
        for (const trackedCommentId of this.trackedCommentIds) {
            if (!newCommentIds.has(trackedCommentId)) {
                console.log(`Comment deleted: ${trackedCommentId}`);
            }
        }

        this.trackedCommentIds = newCommentIds;
    }

    public manualPoll() {
      console.log("[MANUAL POLL CALLED]");
        this.pollOnce();
        if (this.active) {
            console.warn("Manual polling occurred, but adaptive polling remains active.");
        }
    }
    public isActive(): boolean {
      return this.active;
    }
  }
