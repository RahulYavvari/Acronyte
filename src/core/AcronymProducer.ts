// AcronymProducer.ts

export class AcronymProducer {
    private title: string;
    private description: string;
    private context: string;
    // Queue for words that have not yet been returned.
    private wordsQueue: string[] = [];
    // Tracks exact words (after cleaning) to avoid duplicates.
    private usedWords: Set<string> = new Set();
    // Keeps track of how many words have been requested from the API so far.
    private currentMax: number = 0;
  
    // Private constructor – use the static async create method.
    private constructor(title: string, description: string) {
      this.title = title;
      this.description = description;
      // Combine title and description as the API context.
      this.context = `${title} ${description}`;
    }
  
    /**
     * Factory method to create and initialize an instance.
     * It preloads the first 100 words.
     */
    public static async create(title: string, description: string): Promise<AcronymProducer> {
      const instance = new AcronymProducer(title, description);
      await instance.loadMoreWords(100);
      return instance;
    }
  
    /**
     * Helper function to shuffle an array in place.
     * Uses the Fisher-Yates shuffle algorithm.
     */
    private shuffleArray<T>(array: T[]): void {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
    }
  
    /**
     * Formats a word as an acronym by adding a dot after each character.
     * For example, "HELLO" becomes "H.E.L.L.O."
     * @param word The word to format.
     */
    private formatAsAcronym(word: string): string {
      return word.split('').join('.') + '.';
    }
  
    /**
     * Fetches words from the DataMuse API using the combined context.
     * Only words with length between 2 and 6 characters after removing special characters are accepted.
     * New words are shuffled before being appended to the queue.
     * @param count Number of words to extend the API "max" parameter by.
     */
    private async loadMoreWords(count: number): Promise<void> {
      const newMax = this.currentMax + count;
      const url = `https://api.datamuse.com/words?ml=${encodeURIComponent(
        this.context
      )}&max=${newMax}`;
  
      try {
        const response = await fetch(url);
        if (!response.ok) {
          console.error(`Failed to fetch words: ${response.statusText}`);
          return;
        }
        const data: any[] = await response.json();
        const newWords: string[] = [];
        // The API returns an array of objects with a "word" property.
        for (const item of data) {
          if (item.word) {
            // Remove any special characters and convert to upper case.
            const cleanedWord = item.word.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
            if (cleanedWord.length >= 2 && cleanedWord.length <= 6) {
              // Only add the word if it hasn't been used already.
              if (!this.usedWords.has(cleanedWord)) {
                newWords.push(cleanedWord);
                this.usedWords.add(cleanedWord);
              }
            }
          }
        }
        // Update the current maximum count.
        this.currentMax = newMax;
        // Shuffle the new words before adding them.
        this.shuffleArray(newWords);
        this.wordsQueue.push(...newWords);
      } catch (error) {
        console.error("Error fetching words:", error);
      }
    }
  
    /**
     * Returns the next word from the shuffled queue as an acronym.
     * If the queue is empty, it loads a new batch.
     * Returns null if no new words can be fetched.
     */
    public async getNextWord(): Promise<string | null> {
      if (this.wordsQueue.length > 0) {
        const word = this.wordsQueue.shift()!;
        return this.formatAsAcronym(word);
      }
      // Load a new batch if the queue is empty.
      const previousLength = this.wordsQueue.length;
      await this.loadMoreWords(100);
      if (this.wordsQueue.length === previousLength) {
        // No new words were found.
        return null;
      }
      const word = this.wordsQueue.shift()!;
      return this.formatAsAcronym(word);
    }
  }
  
  // --------------------
  // Sample usage:
  // --------------------
  // (async () => {
  //   const title = "programming";
  //   const description = "Computer Programming";
  //   // Create an instance. The first 100 words are loaded automatically.
  //   const producer = await AcronymProducer.create(title, description);
  
  //   console.log("Listing 105 words as acronyms:");
  //   // Request 105 words (forcing another batch fetch when needed)
  //   for (let i = 0; i < 105; i++) {
  //     const word = await producer.getNextWord();
  //     if (!word) {
  //       console.log("No more new words available.");
  //       break;
  //     }
  //     console.log(`${i + 1}: ${word}`);
  //   }
  // })();
