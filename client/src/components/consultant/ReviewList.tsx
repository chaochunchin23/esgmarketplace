import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Star, ThumbsUp, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef } from "react";

type Review = {
  id: number;
  rating: number;
  reviewText: string;
  projectDetails?: string;
  createdAt: string;
  helpfulVotes: number;
  aiInsights?: {
    sentiment: string;
    keyStrengths: string[];
    areasOfImprovement: string[];
    topicAnalysis: Record<string, number>;
  };
  reviewer: {
    id: number;
    username: string;
  };
};

type ReviewListProps = {
  consultantId: number;
  currentUserId?: number;
  scrollToReviewId?: number;
};

function getSentimentVariant(sentiment: string) {
  switch (sentiment.toLowerCase()) {
    case 'positive':
      return 'secondary';
    case 'negative':
      return 'destructive';
    default:
      return 'default';
  }
}

export default function ReviewList({ consultantId, currentUserId, scrollToReviewId }: ReviewListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const reviewRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const { data: reviews = [], isLoading } = useQuery<Review[]>({
    queryKey: [`/api/consultants/${consultantId}/reviews`],
  });

  const voteMutation = useMutation({
    mutationFn: async ({ reviewId, isHelpful }: { reviewId: number; isHelpful: boolean }) => {
      const res = await fetch(`/api/reviews/${reviewId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId, isHelpful }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/consultants/${consultantId}/reviews`],
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (scrollToReviewId && reviewRefs.current[scrollToReviewId]) {
      reviewRefs.current[scrollToReviewId]?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [scrollToReviewId, reviews]);

  if (isLoading) {
    return <div>Loading reviews...</div>;
  }

  return (
    <div className="space-y-6">
      {reviews.map((review, index) => (
        <motion.div
          key={review.id}
          ref={el => reviewRefs.current[review.id] = el}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={scrollToReviewId === review.id ? "ring-2 ring-primary ring-offset-2 rounded-lg" : ""}
        >
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <Avatar>
                <AvatarImage src={`https://api.dicebear.com/7.x/personas/svg?seed=${review.reviewer.username}`} />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{review.reviewer.username}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating
                                ? "text-yellow-400 fill-current"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(review.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>

                  {currentUserId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        voteMutation.mutate({ reviewId: review.id, isHelpful: true })
                      }
                      disabled={voteMutation.isPending}
                    >
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      <span>{review.helpfulVotes}</span>
                    </Button>
                  )}
                </div>

                <p className="mt-4 text-sm">{review.reviewText}</p>

                {review.projectDetails && (
                  <div className="mt-4">
                    <h5 className="text-sm font-medium">Project Details</h5>
                    <p className="text-sm text-muted-foreground mt-1">
                      {review.projectDetails}
                    </p>
                  </div>
                )}

                {review.aiInsights && (
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={getSentimentVariant(review.aiInsights.sentiment)}
                      >
                        {review.aiInsights.sentiment}
                      </Badge>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>AI-generated sentiment analysis</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h6 className="text-sm font-medium mb-2">Key Strengths</h6>
                        <ul className="list-disc list-inside text-sm text-muted-foreground">
                          {review.aiInsights.keyStrengths.map((strength, i) => (
                            <li key={i}>{strength}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h6 className="text-sm font-medium mb-2">Areas of Improvement</h6>
                        <ul className="list-disc list-inside text-sm text-muted-foreground">
                          {review.aiInsights.areasOfImprovement.map((area, i) => (
                            <li key={i}>{area}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}