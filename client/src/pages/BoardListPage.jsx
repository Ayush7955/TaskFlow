import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Columns3, Lock, Globe } from 'lucide-react';
import useBoardStore from '../stores/boardStore';
import useWorkspaceStore from '../stores/workspaceStore';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import Spinner from '../components/Spinner';

export default function BoardListPage() {
  const navigate = useNavigate();
  const { boards, isLoading, fetchBoards } = useBoardStore();
  const { currentWorkspace, workspaces, fetchWorkspaces } = useWorkspaceStore();
  const workspaceId = currentWorkspace?.public_id || currentWorkspace?.id;

  useEffect(() => {
    if (!workspaceId && workspaces.length === 0) {
      fetchWorkspaces();
    }
  }, [workspaceId, workspaces.length, fetchWorkspaces]);

  useEffect(() => {
    if (workspaceId) {
      fetchBoards(workspaceId);
    }
  }, [workspaceId, fetchBoards]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display font-light text-3xl text-ink">Boards</h1>
        <Button
          variant="primary"
          onClick={() => navigate('/boards/new')}
        >
          New board
        </Button>
      </div>

      {/* Board grid or empty state */}
      {boards.length === 0 ? (
        <EmptyState
          icon={Columns3}
          title="No boards yet"
          description="Create your first board to start organizing tasks with your team."
          action={
            <Button variant="primary" onClick={() => navigate('/boards/new')}>
              Create a board
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board) => {
            const boardId = board.public_id || board.id;
            const isPrivate = board.visibility === 'private';
            const membersList = board.members || [];

            return (
              <Card
                key={boardId}
                hover
                onClick={() => navigate(`/boards/${boardId}`)}
                className="flex flex-col gap-4"
              >
                {/* Board name */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display font-light text-xl text-ink leading-tight">
                    {board.name || 'Untitled Board'}
                  </h3>
                  <Badge variant={isPrivate ? 'default' : 'info'} size="sm">
                    {isPrivate ? (
                      <span className="inline-flex items-center gap-1">
                        <Lock size={10} />
                        Private
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <Globe size={10} />
                        Public
                      </span>
                    )}
                  </Badge>
                </div>

                {/* Description */}
                {board.description && (
                  <p className="text-sm text-muted font-body line-clamp-2">
                    {board.description}
                  </p>
                )}

                {/* Members */}
                {membersList.length > 0 && (
                  <div className="flex items-center -space-x-1.5 mt-auto">
                    {membersList.slice(0, 5).map((member, idx) => (
                      <Avatar
                        key={member._id || member.id || idx}
                        name={member.name || member.email}
                        src={member.avatar}
                        size="xs"
                        className="ring-2 ring-surface"
                      />
                    ))}
                    {membersList.length > 5 && (
                      <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-stone-200 text-[8px] font-body font-medium text-secondary ring-2 ring-surface">
                        +{membersList.length - 5}
                      </span>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
