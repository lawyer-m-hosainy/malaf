import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Video, Plus, Search, Calendar, Clock, Users, 
  PhoneOff, Play, ArrowLeft, Scale, User, ExternalLink
} from 'lucide-react';
import { useCasesStore } from '@/store/useCasesStore';
import { useClientsStore } from '@/store/useClientsStore';
import { useAuthStore } from '@/store/useAuthStore';
import { motion } from 'motion/react';
import { apiGet, apiPost } from '@/lib/apiClient';

interface VideoSession {
  id: string;
  caseId: string;
  caseName: string;
  clientName: string;
  status: 'active' | 'scheduled' | 'ended';
  startedAt: string;
  duration?: number;
  notes?: string;
  roomUrl?: string;
}

export function VideoRoomManager() {
  const navigate = useNavigate();
  const cases = useCasesStore(s => s.cases);
  const clients = useClientsStore(s => s.clients);
  const orgId = useAuthStore(s => s.currentUser?.orgId);
  const [search, setSearch] = useState('');
  const [sessions, setSessions] = useState<VideoSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Load sessions from API
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      // ✅ BUG-002 FIX: استخدام apiGet مع Authorization header
      const data = await apiGet('/api/video/sessions/all');
      setSessions(data.sessions || []);
    } catch {
      // Populate with demo data from existing cases
      const demoSessions: VideoSession[] = cases.slice(0, 5).map((c, i) => {
        const client = clients.find(cl => cl.id === c.clientId);
        const statuses: ('active' | 'scheduled' | 'ended')[] = ['ended', 'ended', 'scheduled', 'ended', 'ended'];
        return {
          id: `vs-${i + 1}`,
          caseId: c.id,
          caseName: `${c.plaintiff || 'المدعي'} ضد ${c.defendant || 'المدعى عليه'}`,
          clientName: client?.name || 'غير محدد',
          status: statuses[i],
          startedAt: new Date(Date.now() - (i * 86400000 + Math.random() * 86400000)).toISOString(),
          duration: statuses[i] === 'ended' ? Math.floor(Math.random() * 3600) + 600 : undefined,
          notes: statuses[i] === 'ended' ? 'تم مناقشة آخر المستجدات في القضية' : undefined,
        };
      });
      setSessions(demoSessions);
    }
    setIsLoading(false);
  };

  const createNewRoom = async () => {
    if (!selectedCaseId) return;
    setIsCreating(true);
    try {
      // ✅ BUG-002 FIX: استخدام apiPost مع Authorization header
      const data = await apiPost('/api/video/create-room', { caseId: selectedCaseId });
      navigate(`/dashboard/video/${selectedCaseId}?session=${data.sessionId}&url=${encodeURIComponent(data.roomUrl)}`);
    } catch {
      navigate(`/dashboard/video/${selectedCaseId}`);
    }
    setIsCreating(false);
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h} ساعة ${m} دقيقة`;
    return `${m} دقيقة`;
  };

  const filteredSessions = sessions.filter(s =>
    s.caseName.includes(search) || s.clientName.includes(search)
  );

  const activeSessions = filteredSessions.filter(s => s.status === 'active');
  const scheduledSessions = filteredSessions.filter(s => s.status === 'scheduled');
  const endedSessions = filteredSessions.filter(s => s.status === 'ended');

  const stats = {
    total: sessions.length,
    active: sessions.filter(s => s.status === 'active').length,
    scheduled: sessions.filter(s => s.status === 'scheduled').length,
    totalMinutes: sessions
      .filter(s => s.duration)
      .reduce((acc, s) => acc + (s.duration || 0), 0) / 60,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <Video className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            غرف الاستشارات المرئية
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            إدارة جلسات الاستشارة المرئية مع الموكلين — مشفرة وآمنة
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/30 dark:to-gray-900 border-indigo-100 dark:border-indigo-800/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">إجمالي الجلسات</p>
                  <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 mt-1">{stats.total}</p>
                </div>
                <Video className="w-8 h-8 text-indigo-300 dark:text-indigo-700" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/30 dark:to-gray-900 border-emerald-100 dark:border-emerald-800/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">نشطة الآن</p>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">{stats.active}</p>
                </div>
                <Play className="w-8 h-8 text-emerald-300 dark:text-emerald-700" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/30 dark:to-gray-900 border-amber-100 dark:border-amber-800/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">مجدولة</p>
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">{stats.scheduled}</p>
                </div>
                <Calendar className="w-8 h-8 text-amber-300 dark:text-amber-700" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/30 dark:to-gray-900 border-purple-100 dark:border-purple-800/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">إجمالي الوقت</p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-1">{Math.round(stats.totalMinutes)} <span className="text-sm font-normal">دقيقة</span></p>
                </div>
                <Clock className="w-8 h-8 text-purple-300 dark:text-purple-700" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Create New Room */}
      <Card className="border-dashed border-2 border-indigo-200 dark:border-indigo-800/40 bg-indigo-50/30 dark:bg-indigo-950/10">
        <CardContent className="p-6">
          <h3 className="font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-600" />
            إنشاء غرفة استشارة جديدة
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              aria-label="اختر قضية"
              title="اختر قضية"
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white"
            >
              <option value="">اختر قضية...</option>
              {cases.filter(c => c.status !== 'مغلقة').map(c => (
                <option key={c.id} value={c.id}>
                  {c.firstInstanceNumber ? `قضية ${c.firstInstanceNumber} — ` : ''}{c.plaintiff || 'المدعي'} ضد {c.defendant || 'المدعى عليه'}
                </option>
              ))}
            </select>
            <Button
              onClick={createNewRoom}
              disabled={!selectedCaseId || isCreating}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
            >
              <Video className="w-4 h-4" />
              {isCreating ? 'جاري الإنشاء...' : 'بدء جلسة فيديو'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="بحث في الجلسات..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Active Sessions */}
      {activeSessions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            جلسات نشطة الآن
          </h2>
          {activeSessions.map(session => (
            <SessionCard key={session.id} session={session} navigate={navigate} formatDuration={formatDuration} />
          ))}
        </div>
      )}

      {/* Scheduled Sessions */}
      {scheduledSessions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            جلسات مجدولة
          </h2>
          {scheduledSessions.map(session => (
            <SessionCard key={session.id} session={session} navigate={navigate} formatDuration={formatDuration} />
          ))}
        </div>
      )}

      {/* Past Sessions */}
      {endedSessions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            جلسات سابقة
          </h2>
          {endedSessions.map(session => (
            <SessionCard key={session.id} session={session} navigate={navigate} formatDuration={formatDuration} />
          ))}
        </div>
      )}

      {filteredSessions.length === 0 && !isLoading && (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <Video className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">لا توجد جلسات فيديو بعد</p>
          <p className="text-sm mt-1">أنشئ غرفة استشارة جديدة من الأعلى</p>
        </div>
      )}
    </div>
  );
}

function SessionCard({ session, navigate, formatDuration }: { session: VideoSession; navigate: any; formatDuration: (s: number) => string }) {
  const statusConfig = {
    active: { label: 'نشطة', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    scheduled: { label: 'مجدولة', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    ended: { label: 'منتهية', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  };

  const config = statusConfig[session.status];

  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
      <Card className="hover:shadow-md transition-shadow dark:bg-gray-900/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                session.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                session.status === 'scheduled' ? 'bg-amber-100 dark:bg-amber-900/30' :
                'bg-gray-100 dark:bg-gray-800'
              }`}>
                <Video className={`w-5 h-5 ${
                  session.status === 'active' ? 'text-emerald-600 dark:text-emerald-400' :
                  session.status === 'scheduled' ? 'text-amber-600 dark:text-amber-400' :
                  'text-gray-500 dark:text-gray-400'
                }`} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-gray-800 dark:text-white text-sm truncate">{session.caseName}</p>
                  <Badge variant="outline" className={`text-[10px] shrink-0 ${config.color}`}>{config.label}</Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {session.clientName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(session.startedAt).toLocaleDateString('ar-EG')}
                  </span>
                  {session.duration && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(session.duration)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {session.status === 'active' && (
                <Button
                  size="sm"
                  className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => navigate(`/dashboard/video/${session.caseId}${session.roomUrl ? `?url=${encodeURIComponent(session.roomUrl)}` : ''}`)}
                >
                  <Play className="w-3 h-3" />
                  انضمام
                </Button>
              )}
              {session.status === 'scheduled' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={() => navigate(`/dashboard/video/${session.caseId}`)}
                >
                  <Video className="w-3 h-3" />
                  بدء
                </Button>
              )}
              {session.status === 'ended' && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1 text-gray-500"
                  onClick={() => navigate(`/dashboard/cases`)}
                >
                  <Scale className="w-3 h-3" />
                  القضية
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default VideoRoomManager;
