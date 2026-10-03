import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Star } from "lucide-react";

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  reviewText: z.string().min(10, "Review must be at least 10 characters long"),
  projectDetails: z.string().optional()
});

type ReviewFormProps = {
  consultantId: number;
  reviewerId: number;
  onClose?: (reviewId?: number) => void;
};

export default function ReviewForm({ consultantId, reviewerId, onClose }: ReviewFormProps) {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof reviewSchema>>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      reviewText: "",
      projectDetails: ""
    }
  });

  const reviewMutation = useMutation({
    mutationFn: async (values: z.infer<typeof reviewSchema>) => {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consultantId,
          reviewerId,
          ...values
        })
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      return res.json();
    },
    onSuccess: (data) => {
      // Invalidate both the consultant details and reviews queries
      queryClient.invalidateQueries({ queryKey: [`/api/consultants/${consultantId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/consultants/${consultantId}/reviews`] });

      toast({
        title: "Review submitted",
        description: "Your review has been submitted successfully.",
      });
      form.reset();
      onClose?.(data.id);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: z.infer<typeof reviewSchema>) {
    reviewMutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rating</FormLabel>
              <FormControl>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Button
                      key={rating}
                      type="button"
                      variant="ghost"
                      size="sm"
                      className={`p-0 w-8 h-8 hover:bg-transparent ${
                        rating <= (hoveredStar ?? field.value)
                          ? "text-yellow-400"
                          : "text-muted-foreground"
                      }`}
                      onClick={() => field.onChange(rating)}
                      onMouseEnter={() => setHoveredStar(rating)}
                      onMouseLeave={() => setHoveredStar(null)}
                    >
                      <Star className="h-6 w-6 fill-current" />
                    </Button>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reviewText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Review</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Share your experience working with this consultant..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="projectDetails"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Details (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Brief description of the project you worked on..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={reviewMutation.isPending}
          className="w-full"
        >
          {reviewMutation.isPending ? "Submitting..." : "Submit Review"}
        </Button>
      </form>
    </Form>
  );
}