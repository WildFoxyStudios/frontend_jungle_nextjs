"use client";

import { useState } from "react";
import { postsApi } from "@jungle/api-client";
import type { Poll } from "@jungle/api-client";
import { Button, Progress } from "@jungle/ui";
import { toast } from "sonner";

interface PollVotingProps {
  poll: Poll;
  postId: number;
}

export function PollVoting({ poll, postId }: PollVotingProps) {
  const [myVote, setMyVote] = useState<number | undefined>(poll.my_vote);
  const [options, setOptions] = useState(poll.options);
  const [totalVotes, setTotalVotes] = useState(poll.total_votes);
  const [isVoting, setIsVoting] = useState(false);

  const isExpired = new Date(poll.expires_at) < new Date();
  const hasVoted = myVote !== undefined;

  const handleVote = async (optionId: number) => {
    if (hasVoted || isExpired || isVoting) return;
    setIsVoting(true);
    try {
      await postsApi.votePoll(postId, optionId);
      setMyVote(optionId);
      setTotalVotes((t) => t + 1);
      setOptions((prev) =>
        prev.map((o) =>
          o.id === optionId ? { ...o, vote_count: o.vote_count + 1 } : o
        )
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to vote");
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
      <p className="text-sm font-semibold">{poll.question}</p>
      {options.map((option) => {
        const pct = totalVotes > 0 ? Math.round((option.vote_count / totalVotes) * 100) : 0;
        const isSelected = myVote === option.id;
        return (
          <div key={option.id} className="space-y-1">
            <Button
              variant={isSelected ? "default" : "outline"}
              className="w-full justify-between h-9 text-sm"
              onClick={() => handleVote(option.id)}
              disabled={hasVoted || isExpired || isVoting}
            >
              <span>{option.text}</span>
              {hasVoted && <span className="text-xs">{pct}%</span>}
            </Button>
            {hasVoted && <Progress value={pct} className="h-1" />}
          </div>
        );
      })}
      <p className="text-xs text-muted-foreground">
        {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
        {isExpired ? " · Ended" : ""}
      </p>
    </div>
  );
}
