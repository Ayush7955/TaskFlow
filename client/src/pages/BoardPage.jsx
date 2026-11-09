import { useParams } from 'react-router-dom';
import BoardHeader from '../features/board/BoardHeader';
import BoardView from '../features/board/BoardView';
import CardModal from '../features/card/CardModal';
import useSocket from '../hooks/useSocket';

export default function BoardPage() {
  const { boardId } = useParams();
  useSocket(boardId);

  return (
    <div className="flex flex-col h-screen bg-canvas overflow-hidden">
      <BoardHeader />
      <BoardView />
      <CardModal />
    </div>
  );
}
