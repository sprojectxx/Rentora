import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { propertyService } from '@/api/propertyService';
import { useAuth } from '@/lib/AuthContext';
import { handleError } from '@/lib/errorHandler';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ReviewSection({ propertyId }) {
    const { user, navigateToLogin } = useAuth();
    const queryClient = useQueryClient();
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const { data: reviews = [], isLoading } = useQuery({
        queryKey: ["reviews", propertyId],
        queryFn: () => propertyService.getReviews(propertyId),
        enabled: !!propertyId
    });

    const hasReviewed = user ? reviews.some(r => r.user_id === user.id) : false;

    const avgRating = reviews.length > 0 
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
        : 0;

    const handleSubmit = async () => {
        if (!user) return navigateToLogin();
        if (rating === 0) return toast.error("Please select a rating.");
        setSubmitting(true);
        try {
            await propertyService.addReview(propertyId, user.id, rating, comment);
            toast.success("Review posted successfully!");
            queryClient.invalidateQueries({ queryKey: ["reviews", propertyId] });
            setRating(0);
            setComment("");
        } catch (err) {
            handleError(err, "Failed to post review. You may have already reviewed this property.");
        } finally {
            setSubmitting(false);
        }
    };

    if (isLoading) return <div className="mt-12 text-center text-muted-foreground animate-pulse">Loading reviews...</div>;

    return (
        <div className="mt-16 pt-10 border-t border-border">
            <div className="flex items-center gap-4 mb-8">
                <h2 className="font-display text-3xl font-medium">Reviews</h2>
                {reviews.length > 0 && (
                    <div className="flex items-center gap-1.5 bg-secondary/30 px-3 py-1 rounded-full border border-border">
                        <Star className="w-4 h-4 fill-primary text-primary" />
                        <span className="font-semibold">{avgRating}</span>
                        <span className="text-muted-foreground text-sm">({reviews.length} reviews)</span>
                    </div>
                )}
            </div>

            {(!user || user.role === 'student') && !hasReviewed && (
                <div className="mb-10 bg-secondary/10 p-6 rounded-3xl border border-border">
                    <h3 className="font-medium mb-4 text-lg">Leave a review</h3>
                    <div className="flex gap-1 mb-4" onMouseLeave={() => setHoverRating(0)}>
                        {[1, 2, 3, 4, 5].map(star => (
                            <Star 
                                key={star}
                                className={`w-8 h-8 cursor-pointer transition-all ${star <= (hoverRating || rating) ? "fill-primary text-primary" : "text-border"}`}
                                onMouseEnter={() => setHoverRating(star)}
                                onClick={() => setRating(star)}
                            />
                        ))}
                    </div>
                    <Textarea 
                        placeholder={user ? "Share your experience with this property..." : "Please log in to leave a review."}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="rounded-xl mb-4 bg-background"
                        rows={3}
                        disabled={!user || submitting}
                    />
                    <div className="flex justify-end">
                        <Button onClick={handleSubmit} disabled={!user || submitting || rating === 0} className="rounded-full px-6">
                            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {user ? "Post Review" : "Login to Review"}
                        </Button>
                    </div>
                </div>
            )}

            <div className="space-y-6">
                {reviews.length === 0 ? (
                    <div className="text-center p-10 bg-secondary/10 rounded-3xl border border-dashed border-border text-muted-foreground">
                        No reviews yet. Be the first to review!
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                        {reviews.map(review => (
                            <div key={review.id} className="p-6 rounded-3xl border border-border bg-card shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="w-10 h-10">
                                            <AvatarImage src={review.users?.avatar_url} />
                                            <AvatarFallback className="bg-primary/20 text-primary">
                                                {review.users?.full_name?.[0] || "?"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-medium text-sm">{review.users?.full_name || "Anonymous User"}</div>
                                            <div className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-0.5">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <Star key={star} className={`w-4 h-4 ${star <= review.rating ? "fill-primary text-primary" : "text-border"}`} />
                                        ))}
                                    </div>
                                </div>
                                {review.comment && <p className="text-sm text-foreground/80 leading-relaxed">{review.comment}</p>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

