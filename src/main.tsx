import { Devvit, useState, useWebView, useAsync, RedditAPIClient } from '@devvit/public-api';
import { BlocksToWebviewMessage, WebviewToBlockMessage } from '../game/shared.js';
import { Preview } from './components/Preview.js';
import { AcronymProducer } from './core/AcronymProducer.js';
import { LeaderboardService } from './core/LeaderboardService.js';
import { AdaptivePoller, CustomComment } from './core/AdaptivePoller.js';
import fetchComments from './utils/fetchComments.js';


Devvit.configure({
  redditAPI: true,
  http: true,
  redis: true,
  realtime: true,
});


///////////////////
Devvit.addSchedulerJob({
  name: 'daily_thread',
  onRun: async (_, context) => {
    console.log('daily_thread handler called');
    const subreddit = await context.reddit.getCurrentSubreddit();
    const resp = await context.reddit.submitPost({
      subredditName: subreddit.name,
      title: `Ready for today's acronym?`,
      preview: <Preview />,
    });
    console.log('posted resp');
  },
});

Devvit.addTrigger({
  events: ['AppUpgrade', 'AppInstall'],
  onEvent: async (_, context) => {
    try {
      let jobId = (await context.redis.get('jobId'));
      if(jobId) {
        await context.scheduler.cancelJob(jobId);
      }
      // const jobs = await context.scheduler.listJobs();
      // jobs.forEach(async job => {
      //   await context.scheduler.cancelJob(job.id);
      // });
      jobId = await context.scheduler.runJob({
        cron: '0 0 * * *',
        name: 'daily_thread',
        data: {},
      });
      await context.redis.set('jobId', jobId);
    } catch (e) {
      console.log('error was not able to schedule:', e);
      throw e;
    }
  },
}
);


Devvit.addTrigger({
  events: ['AppUpgrade','AppInstall'],
  onEvent: async (_, context) => {
    try {
      const subredditName = await context.subredditName || "";
      const subredditInfo = await context.reddit.getSubredditInfoByName(subredditName);
      console.log(subredditInfo)
      let producer = await AcronymProducer.create(subredditInfo?.name ?? "Reddit", subredditInfo.description?.markdown ?? "");
      let acronyms: any = {};
      let flag = false;
      for (let i = 0; i < 100; i++) {
        const strIdx = i.toString();
        const newWord = await producer.getNextWord();
        if(newWord) {
          acronyms[strIdx] = newWord;
        } else {
          flag = true;
          break;
        }
      }
      if(flag) {
        producer = await AcronymProducer.create("Reddit", "");
        for (let i = 0; i < 100; i++) {
          const strIdx = i.toString();
          acronyms[strIdx] = await producer.getNextWord();
        }
      }
      await context.redis.del('acronyms');
      await context.redis.hSet('acronyms', acronyms);
      await context.redis.set('acronymIndex', '0');
    } catch (e) {
      console.log('Error Fetching the subreddit info:', e);
      throw e;
    }
  },
}
);

Devvit.addTrigger({
  event: 'PostCreate',
  onEvent: async (_, context) => {
    try {
      const postId = _.post?.id ?? "";
      const currIdx = await context.redis.get('acronymIndex') ?? "";
      const acronym = await context.redis.hGet('acronyms', currIdx) ?? "";
      await context.redis.hSet('posts', { [postId]: acronym });
      await context.redis.incrBy('acronymIndex', 1);
    } catch (e) {

    }
  }
});

Devvit.addMenuItem({
  // Please update as you work on your idea!
  label: 'Acronyte - Start',
  location: 'subreddit',
  forUserType: 'moderator',
  onPress: async (_event, context) => {
    const { reddit, ui } = context;
    const subreddit = await reddit.getCurrentSubreddit();


    const post = await reddit.submitPost({
      // Title of the post. You'll want to update!
      title: 'Acronyte',
      subredditName: subreddit.name,
      preview: <Preview />,
    });
    ui.showToast({ text: 'Created post!' });
    ui.navigateTo(post.url);
  },
});

// Add a post type definition
Devvit.addCustomPostType({
  name: 'Experience Post',
  height: 'tall',
  render: (context) => {
    const webview = useWebView<WebviewToBlockMessage, BlocksToWebviewMessage>({
      onMessage: async (event, { postMessage }) => {
        console.log('Received message', event);
        const data = event as unknown as WebviewToBlockMessage;
        console.log('-------------------');
        switch (data.type) {
          case 'INIT':
            const postId = await context.postId ?? "";
            const currAcronym = await context.redis.hGet('posts', postId) ?? "";
            postMessage({
              type: "INIT_RESPONSE",
              payload: {
                acronym: currAcronym
              }
            });

            const redditAPIClient = await context.reddit;
            const postid = await context.postId ?? "";
            const createdTime = new Date();

            const redisClient = await context.redis;
            const leaderboardService_init = new LeaderboardService(redisClient);

            const poller = new AdaptivePoller(fetchComments, leaderboardService_init, createdTime, postid, redditAPIClient);
            poller.start();
            poller.manualPoll();
      
            setTimeout(async ()=> {
              const leaderboard = await leaderboardService_init.getLeaderboard(`leaderboard:${postid}`, 0, 10);
              console.log("[LEADERBOARD]", JSON.stringify(leaderboard, null, 2));
            }, 1000);

            break;
          case 'GET_LEADERBOARD_REQUEST':
            const postid_request = await context.postId;
            const redisClient_request = await context.redis;
            const leaderboardService_request = new LeaderboardService(redisClient_request);
            const leaderboard = await leaderboardService_request.getLeaderboard(`leaderboard:${postid_request}`, 0, 10);

            const leaderboardResponse: { author: string; score: number; rank: number; text: string }[] = [];
            
            const leaderboardResponsePromises = leaderboard?.members.map(async (member) => {
              const commentId = member.id;
              const comment = await context.reddit.getCommentById(commentId);
              const authorName = comment.authorName;
              const body = comment.body;
              return {
                author: authorName,
                score: member.score,
                rank: member.rank,
                text: body
              };
            });
            
            if (leaderboardResponsePromises) {
              const leaderboardResponse = await Promise.all(leaderboardResponsePromises);
              postMessage({
                type: 'GET_LEADERBOARD_RESPONSE',
                payload: leaderboardResponse,
              });
              console.log("Posted Leaderboard");
            }
            break;

          default:
            console.error('Unknown message type', data satisfies never);
            break;
        }
      },
    });

    return (
      <vstack height="100%" width="100%"  padding="small" alignment="middle center">
        <vstack padding="small" cornerRadius="medium" alignment="middle center" >
              <text color="#1870f4" weight="bold" size="xxlarge"  >A.C.R.O.N.Y.T.E</text>
              <spacer size="large" />
              <text weight="bold" size="large">Comment the full form of the acronym to play!</text>
              <spacer size="medium"/>
              <text>See a cool acronym? Smash that upvote!</text>
              <text>Your acronym got the most karma? You win!!</text>
              <spacer size="medium"/>

              <button onPress={() => webview.mount()} appearance="primary">See what's up</button>
        </vstack>
      </vstack>
    );
    
  },
});

export default Devvit;
