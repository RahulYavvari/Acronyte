import { RedditAPIClient } from "@devvit/public-api";
import { CustomComment } from "../core/AdaptivePoller.js";

const fetchComments = async (postid: string, redditAPI: RedditAPIClient) => {
    console.log(redditAPI);
    const post = await redditAPI.getPostById(postid);
    const commentsResponse = post.comments;
    const comments = await commentsResponse.all();
    const res: CustomComment[] = [];
    comments.forEach(comment => {
        console.log(comment.authorId, comment.authorName, comment.score, comment.body);
        res.push({
            commentId: comment.id,
            score: comment.score,
            text: comment.body,
            authorId: comment.authorId ?? "",
            authorName: comment.authorName,
        });
    });

    return res;
}

export default fetchComments;