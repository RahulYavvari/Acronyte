import { Devvit, useState, useWebView, useAsync, RedditAPIClient } from '@devvit/public-api';
// import { DEVVIT_SETTINGS_KEYS } from './constants.js';
import { BlocksToWebviewMessage, WebviewToBlockMessage } from '../game/shared.js';
import { Preview } from './components/Preview.js';
import { getPokemonByName } from './core/pokeapi.js';
import { AcronymProducer } from './core/AcronymProducer.js';
import { LeaderboardService } from './core/LeaderboardService.js';
import { AdaptivePoller, CustomComment } from './core/AdaptivePoller.js';
import fetchComments from './utils/fetchComments.js';

// PayloadDevvit.addSettings([
//   // Just here as an example
//   {
//     name: DEVVIT_SETTINGS_KEYS.SECRET_API_KEY,
//     label: 'API Key for secret things',
//     type: 'string',
//     isSecret: true,
//     scope: 'app',
//   },
// ]);

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
      title: 'Daily Thread',
      // text: 'This is a daily thread, comment here!',
      preview: <Preview />,
    });
    console.log('posted resp');
  },
});

Devvit.addTrigger({
  event: 'AppUpgrade',
  onEvent: async (_, context) => {
    try {
      let jobId = (await context.redis.get('jobId')) || '0';
      await context.scheduler.cancelJob(jobId);
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
      console.log("Job Scheduled");
    } catch (e) {
      console.log('error was not able to schedule:', e);
      throw e;
    }
  },
}
);


Devvit.addTrigger({
  event: 'AppUpgrade',
  onEvent: async (_, context) => {
    try {
      const subredditName = await context.subredditName || "";
      const subredditInfo = await context.reddit.getSubredditInfoByName(subredditName);
      console.log(subredditInfo.name);
      console.log(subredditInfo.description?.markdown);
      const producer = await AcronymProducer.create('Programming', '');
      let acronyms: any = {};
      for (let i = 0; i < 100; i++) {
        const strIdx = i.toString();
        acronyms[strIdx] = await producer.getNextWord();
      }
      await context.redis.del('acronyms');
      await context.redis.hSet('acronyms', acronyms);
      await context.redis.set('acronymIndex', '0');
      // await context.redis.set('acronyms', JSON.stringify(acronyms));
      // console.log(await context.redis.hGetAll('acronyms'));
      // console.log(await context.redis.get('acronymIndex'));
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
      console.log(currIdx, acronym);
      console.log("------createed-------", _.post?.id);
      console.log("[--wv--] ", currIdx, acronym, postId);
      await context.redis.hSet('posts', { [postId]: acronym });

      await context.redis.incrBy('acronymIndex', 1);
    } catch (e) {

    }
  }
});

Devvit.addTrigger({
  event: "CommentCreate",
  onEvent: (_, context) => {
    console.log(_.comment?.author, _.comment?.body, _.comment?.score);
  }
});

Devvit.addTrigger({
  event: "CommentUpdate",
  onEvent: (_, context) => {
    console.log(_.comment?.author, _.comment?.body, _.comment?.score);
  }
});



//////////////////


Devvit.addMenuItem({
  // Please update as you work on your idea!
  label: 'Make my experience post',
  location: 'subreddit',
  forUserType: 'moderator',
  onPress: async (_event, context) => {
    const { reddit, ui } = context;
    const subreddit = await reddit.getCurrentSubreddit();


    const post = await reddit.submitPost({
      // Title of the post. You'll want to update!
      title: 'My first experience post',
      subredditName: subreddit.name,
      preview: <Preview />,
    });
    console.log('create: ', post.id);
    ////////////////////////////
    const postId = post.id;

    ////////////////////////////
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
            console.log("[POST]", currAcronym, " ", postId);
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

            // await leaderboardService.deleteLeaderboard(`leaderboard:${postid}`);
            // if(await leaderboardService.exists(`leaderboard:${postid}`)) {
            // Adptive polling not implemented yet
            // }
            const poller = new AdaptivePoller(fetchComments, leaderboardService_init, createdTime, postid, redditAPIClient);
            poller.start();
            poller.manualPoll();
            
            // const comments = await fetchComments(postid, redditAPIClient);
            // console.log(comments);

            // ///////////////////LEADERBOARD TESTING//////////////////
            // // Pass the client to your service.
            // const redisClient = await context.redis;
            // const leaderboardService = new LeaderboardService(redisClient);

            // // Create a new leaderboard.
            // await leaderboardService.createLeaderboard('game1', 'Game 1 Leaderboard', 'Top players in Game 1');

            // // // Add/update members.
            // await leaderboardService.addOrUpdateMember('game1', 'player1', 1500);
            // await leaderboardService.addOrUpdateMember('game1', 'player2', 1800);
            // await leaderboardService.addOrUpdateMember('game1', 'player3', 1200);
            // await leaderboardService.addOrUpdateMember('game1', 'player2', 1900);


            // // // Retrieve the top 2 players.
            setTimeout(async ()=> {
              const leaderboard = await leaderboardService_init.getLeaderboard(`leaderboard:${postid}`, 0, 10);
              console.log("[LEADERBOARD]", JSON.stringify(leaderboard, null, 2));
            }, 1000);

            // // // Clean up.
            // await leaderboardService.deleteLeaderboard(`leaderboard:${postid}`);
            // // //////////////////////////////////////

            break;
          case 'GET_LEADERBOARD_REQUEST':
            // context.ui.showToast({ text: `Received message: ${JSON.stringify(data)}` });
            // const pokemon = await getPokemonByName(data.payload.name);

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
              console.log("[PREPOST]", leaderboardResponse);
              postMessage({
                type: 'GET_LEADERBOARD_RESPONSE',
                payload: leaderboardResponse,
              });
              console.log("Posted Leaderboard");
            }

            // postMessage({
            //   type: 'GET_LEADERBOARD_RESPONSE',
            //   payload: leaderboardResponse,
            // });

            // setTimeout(() => {
            //   console.log(leaderboardResponse);
            // }, 1000);

            // postMessage({
            //   type: 'GET_LEADERBOARD_RESPONSE',
            //   payload: leaderboardResponse,
            // });
            break;

          default:
            console.error('Unknown message type', data satisfies never);
            break;
        }
      },
    });

    // useAsync(async () => {
    //   const postId = await context.postId ?? "";


    //   const currAcronym = await context.redis.hGet('posts', postId) ?? "";
    //   console.log("[[]]", currAcronym, " ", postId);
    //   webview.postMessage({ 
    //     type: "INIT_RESPONSE",
    //     payload: { 
    //       postId: currAcronym
    //     }
    //   });
    //   return currAcronym;
    // });

    return (
      <vstack height="100%" width="100%" alignment="center middle">
        <button
          onPress={() => {
            webview.mount();
          }}
        >
          Launch
        </button>
      </vstack>
    );
  },
});

export default Devvit;
