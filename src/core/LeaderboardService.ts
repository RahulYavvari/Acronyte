interface LeaderboardMeta {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface Member {
  id: string;
  score: number;
  rank: number;
}

interface Leaderboard {
  meta: LeaderboardMeta;
  members: Member[];
}

export class LeaderboardService {
  private redisClient: any;

  constructor(redisClient: any) {
    this.redisClient = redisClient;
  }

  private getLeaderboardKey(id: string): string {
    return `leaderboard:${id}`;
  }

  private getLeaderboardMetaKey(id: string): string {
    return `leaderboardMeta:${id}`;
  }

  async createLeaderboard(id: string, name = '', description = ''): Promise<void> {
    const metaKey = this.getLeaderboardMetaKey(id);
    const meta = await this.redisClient.hGetAll(metaKey);
    if (meta && Object.keys(meta).length > 0) {
      throw new Error(`Leaderboard with id "${id}" already exists.`);
    }
    const now = new Date().toISOString();
    const leaderboardMeta: LeaderboardMeta = {
      id,
      name,
      description,
      createdAt: now,
      updatedAt: now,
    };
    await this.redisClient.hSet(metaKey, leaderboardMeta as any);
  }
  
  async exists(id: string): Promise<boolean> {
    const metaKey = this.getLeaderboardMetaKey(id);
    const meta = await this.redisClient.hGetAll(metaKey);
    return meta && Object.keys(meta).length > 0;
  }

  async getLeaderboard(id: string, start = 0, stop = -1): Promise<Leaderboard | null> {
    const metaKey = this.getLeaderboardMetaKey(id);
    const meta = await this.redisClient.hGetAll(metaKey);
    if (!meta || Object.keys(meta).length === 0) {
      return null;
    }
    const leaderboardKey = this.getLeaderboardKey(id);
    const total = await this.redisClient.zCard(leaderboardKey);
  
    if (total === 0) {
      return {
        meta: {
          id,
          name: meta.name,
          description: meta.description,
          createdAt: meta.createdAt,
          updatedAt: meta.updatedAt,
        },
        members: []
      };
    }
  
    let ascStart: number, ascStop: number;
    if (stop === -1) {
      ascStart = 0;
      ascStop = total - start - 1;
    } else {
      ascStart = total - stop - 1;
      ascStop = total - start - 1;
    }
    const ascMembers: any[] = await this.redisClient.zRange(leaderboardKey, ascStart, ascStop);
    const descMembers = ascMembers.reverse();
  
    const members: Member[] = [];
    for (let i = 0; i < descMembers.length; i++) {
      const memberObj = descMembers[i];
      const memberId = memberObj.member;
      const score = memberObj.score;
      members.push({
        id: memberId,
        score,
        rank: start + i + 1,
      });
    }
  
    return {
      meta: {
        id,
        name: meta.name,
        description: meta.description,
        createdAt: meta.createdAt,
        updatedAt: meta.updatedAt,
      },
      members,
    };
  }

  async updateLeaderboard(id: string, name?: string, description?: string): Promise<void> {
    const metaKey = this.getLeaderboardMetaKey(id);
    const meta = await this.redisClient.hGetAll(metaKey);
    if (!meta || Object.keys(meta).length === 0) {
      throw new Error(`Leaderboard with id "${id}" does not exist.`);
    }
    const updateData: Record<string, string> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    updateData.updatedAt = new Date().toISOString();
    await this.redisClient.hSet(metaKey, updateData);
  }

  async deleteLeaderboard(id: string): Promise<void> {
    const metaKey = this.getLeaderboardMetaKey(id);
    const leaderboardKey = this.getLeaderboardKey(id);
    await this.redisClient.del(metaKey);
    await this.redisClient.del(leaderboardKey);
  }

  async addOrUpdateMember(leaderboardId: string, memberId: string, score: number): Promise<void> {
    const leaderboardKey = this.getLeaderboardKey(leaderboardId);
    await this.redisClient.zAdd(leaderboardKey, { score, member: memberId });
  }

  async removeMember(leaderboardId: string, memberId: string): Promise<void> {
    const leaderboardKey = this.getLeaderboardKey(leaderboardId);
    await this.redisClient.zRem(leaderboardKey, memberId);
  }

  async getMemberScore(leaderboardId: string, memberId: string): Promise<number | null> {
    const leaderboardKey = this.getLeaderboardKey(leaderboardId);
    const score = await this.redisClient.zScore(leaderboardKey, memberId);
    return score !== null ? score : null;
  }

  async getMemberRank(leaderboardId: string, memberId: string): Promise<number | null> {
    const leaderboardKey = this.getLeaderboardKey(leaderboardId);
    const ascRank = await this.redisClient.zRank(leaderboardKey, memberId);
    if (ascRank === null) return null;
    const total = await this.redisClient.zCard(leaderboardKey);
    const revRank = total - ascRank - 1;
    return revRank + 1;
  }
}
