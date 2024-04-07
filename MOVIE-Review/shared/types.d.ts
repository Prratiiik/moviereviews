export type Review = {
  movieId: number; // Partition key
  ReviewerName: string;
  ReviewDate: string; // Format: "YYYY-MM-DD"
  Content: string;
  Rating: number; // Range: 1-5
}