# Acronyte

Acronyte is a dynamic, community-driven application that transforms subreddit identities into daily acronym challenges. By generating an acronym from the subreddit’s name and description, Acronyte invites users to craft their own creative expansions. Upvotes and a real-time leaderboard foster friendly competition, making each day a unique celebration of creativity.

## Features

- **Daily Acronym Challenge:** Generate a fresh acronym every day based on the subreddit’s theme.
- **User-Generated Content:** Submit your own interpretations and vote on your favorites.
- **Interactive Leaderboard:** Track top submissions in real-time using Redis sorted sets.
- **Real-Time Updates:** Adaptive polling ensures that comments and submissions are updated efficiently.
- **Seamless API Integrations:** Utilizes Devvit, Reddit, and Datamuse APIs to deliver a unique, engaging experience.

## Technologies Used

- **Frontend:** React with Vite for a fast, responsive webview.
- **Backend:** Node.js for handling server-side operations and API interactions.
- **Data Management:** Redis for maintaining a live leaderboard.
- **APIs:**
  - Devvit API for interactive posts.
  - Reddit API for community engagement.
  - Datamuse API for generating creative acronyms.

## Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/RahulYavvari/Acronyte
   cd acronyte
   ```

2. **Install Dependencies:**

   ```bash
   npm install
   ```

3. **Run the Application:**

   ```bash
   npm run dev
   ```

## Usage

- **Daily Challenge:** Visit the app to see today's generated acronym challenge.
- **Submit Your Entry:** Comment your full form and engage with the community.
- **Leaderboard:** Check the interactive leaderboard to see top submissions based on upvotes.

## Contributing

Contributions are welcome! If you have suggestions, bug fixes, or improvements, please open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Contact

For any questions or feedback, please contact [rahulyavvari@outlook.com].