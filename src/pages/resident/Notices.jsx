import { Pin, Bell, Vote, CheckCircle2, Clock, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCollection } from '../../hooks/useCollection';
import { formatDate, daysUntil } from '../../utils/format';
import { voteInPoll } from '../../services/noticeService';

import PageHeader from '../../components/ui/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';

const categoryTones = {
  Maintenance: 'warning',
  General: 'neutral',
  Event: 'brand',
  Security: 'danger',
};

export default function Notices() {
  const { user } = useAuth();
  const notices = useCollection('notices') || [];
  const polls = useCollection('polls') || [];

  const sortedNotices = [...notices].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  async function handleVote(pollId, optionId) {
    if (!user?.id) return;
    try {
      await voteInPoll(pollId, optionId, user.id);
      polls.refetch && polls.refetch();
    } catch (err) {
      console.error('Failed to vote:', err);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Notices & Polls"
        description="Stay informed with recent society notices, announcements, and community votes."
      />

      {/* Notices Section */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-ink-900">Society Notices</h2>

        {sortedNotices.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                icon={Bell}
                title="No notices"
                description="There are currently no announcements posted for the society."
              />
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedNotices.map((notice) => {
              const tone = categoryTones[notice.category] || 'brand';
              const isPinned = notice.pinned;

              return (
                <Card
                  key={notice.id}
                  className={isPinned ? 'border-amber-200 bg-amber-50/40' : ''}
                >
                  <CardBody className="space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isPinned && (
                          <span className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                            <Pin size={12} className="fill-amber-700" />
                            Pinned
                          </span>
                        )}
                        <Badge tone={tone}>{notice.category}</Badge>
                      </div>

                      <span className="flex items-center gap-1 text-xs text-ink-400">
                        <Clock size={13} />
                        {formatDate(notice.createdAt)}
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-ink-900">{notice.title}</h3>
                    <p className="text-sm text-ink-600 leading-relaxed whitespace-pre-line">
                      {notice.body}
                    </p>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Community Polls Section */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-ink-900">Community Polls</h2>

        {polls.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                icon={Vote}
                title="No active polls"
                description="There are no active society polls at this time."
              />
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-5">
            {polls.map((poll) => {
              const hasVoted = user?.id ? poll.votesBy?.includes(user.id) : false;
              const totalVotes = poll.options?.reduce((sum, opt) => sum + (opt.votes || 0), 0) || 0;
              const remainingDays = poll.closesAt ? daysUntil(poll.closesAt) : null;

              return (
                <Card key={poll.id}>
                  <CardHeader
                    title={poll.question}
                    subtitle={
                      <span className="flex items-center gap-1.5 text-xs text-ink-500 mt-0.5">
                        <Calendar size={13} />
                        Closes on {formatDate(poll.closesAt)}
                        {remainingDays !== null && remainingDays >= 0 && (
                          <span className="text-ink-400">({remainingDays} days left)</span>
                        )}
                      </span>
                    }
                    action={
                      hasVoted ? (
                        <Badge tone="success" className="flex items-center gap-1">
                          <CheckCircle2 size={13} /> Voted
                        </Badge>
                      ) : null
                    }
                  />
                  <CardBody className="space-y-3">
                    {poll.options.map((option) => {
                      const votes = option.votes || 0;
                      const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;

                      return (
                        <div key={option.id} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-ink-800">{option.text}</span>
                            <span className="text-xs text-ink-500">
                              {votes} {votes === 1 ? 'vote' : 'votes'} ({percentage}%)
                            </span>
                          </div>

                          {/* Progress bar container */}
                          <div className="h-2.5 w-full rounded-full bg-ink-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-brand-600 transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>

                          {!hasVoted && (
                            <button
                              type="button"
                              onClick={() => handleVote(poll.id, option.id)}
                              className="mt-1 w-full rounded-md border border-brand-200 bg-brand-50/50 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100 hover:text-brand-800 transition-colors"
                            >
                              Vote for "{option.text}"
                            </button>
                          )}
                        </div>
                      );
                    })}

                    <div className="pt-2 text-right text-xs text-ink-400">
                      Total votes cast: {totalVotes}
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
