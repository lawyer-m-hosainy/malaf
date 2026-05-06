import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

interface StartVideoButtonProps {
  caseId: string;
  caseName: string;
  clientName: string;
}

const StartVideoButton: React.FC<StartVideoButtonProps> = ({ caseId, caseName, clientName }) => {
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();

  const startSession = async () => {
    setIsCreating(true);
    try {
      const officeId = currentUser?.orgId || currentUser?.id;
      const lawyerId = currentUser?.id;

      const res = await fetch('/api/video/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId, caseName, clientName, officeId, lawyerId })
      });
      const data = await res.json();
      if (data.success) {
        navigate(`/dashboard/video/${caseId}?session=${data.sessionId}&url=${encodeURIComponent(data.roomUrl)}`);
      } else {
        alert("فشل إنشاء غرفة الاستشارة: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("حدث خطأ في الاتصال بالسيرفر");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <button
      onClick={startSession}
      disabled={isCreating}
      className="flex items-center justify-center gap-2 bg-[#15803d] hover:bg-[#166534] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {isCreating ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <Video className="w-5 h-5" />
      )}
      {isCreating ? 'جاري إنشاء الغرفة...' : 'بدء استشارة مرئية'}
    </button>
  );
};

export default StartVideoButton;
