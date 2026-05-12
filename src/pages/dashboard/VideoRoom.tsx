import React, { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import DailyIframe from '@daily-co/daily-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  Mic, MicOff, Video, VideoOff, MonitorUp, StopCircle, 
  PhoneOff, Circle, FileText, MessageSquare, Save, Send
} from 'lucide-react';
import { apiGet, apiPost } from '@/lib/apiClient';

export default function VideoRoom() {
  const { caseId } = useParams();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  const roomUrl = searchParams.get('url'); // Alternatively we might fetch this from DB
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [activeTab, setActiveTab] = useState('case');
  const [notes, setNotes] = useState('');
  const [messages, setMessages] = useState<{sender: string, text: string, time: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [duration, setDuration] = useState(0);
  
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const callRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    // If we only have sessionId but no roomUrl, we should theoretically fetch the room_url from our backend.
    // Assuming for now roomUrl is passed or we fetch it. We'll simulate fetching if not in URL.
    const fetchSessionData = async () => {
      try {
        if (!roomUrl && sessionId) {
           // ✅ BUG-001 FIX: استخدام apiGet مع Authorization header
           const data = await apiGet(`/api/video/sessions/${caseId}`);
           const session = data.sessions?.find((s: any) => s.id === sessionId);
           if (session && session.room_url) {
             initDaily(session.room_url);
           }
        } else if (roomUrl) {
          initDaily(roomUrl);
        }
      } catch (err) {
        console.error("Failed to fetch session:", err);
      }
    };
    
    fetchSessionData();

    return () => {
      if (callRef.current) {
        callRef.current.destroy();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [caseId, sessionId, roomUrl]);

  const initDaily = (url: string) => {
    if (!videoContainerRef.current) return;
    
    const call = DailyIframe.createFrame(
      videoContainerRef.current,
      {
        iframeStyle: {
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: '12px'
        },
        showLeaveButton: false,
        showFullscreenButton: true
      }
    );

    call.join({ url });
    callRef.current = call;

    call.on('joined-meeting', () => {
      setIsLoading(false);
      setIsJoined(true);
      // Start duration timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    });

    call.on('participant-joined', (e: any) => {
      console.log('انضم:', e.participant.user_name);
    });

    call.on('recording-started', () => setIsRecording(true));
    call.on('recording-stopped', () => setIsRecording(false));
    call.on('camera-error', () => setIsCamOn(false));
    
    // Listen to daily app messages for chat
    call.on('app-message', (e: any) => {
       if (e.data?.message) {
         setMessages(prev => [...prev, {
           sender: e.fromId,
           text: e.data.message,
           time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
         }]);
       }
    });
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleMic = () => {
    callRef.current?.setLocalAudio(!isMicOn);
    setIsMicOn(!isMicOn);
  };

  const toggleCam = () => {
    callRef.current?.setLocalVideo(!isCamOn);
    setIsCamOn(!isCamOn);
  };

  const toggleShare = () => {
    if (isSharing) {
      callRef.current?.stopScreenShare();
    } else {
      callRef.current?.startScreenShare();
    }
    setIsSharing(!isSharing);
  };

  const toggleRecording = () => {
    if (isRecording) {
      callRef.current?.stopRecording();
    } else {
      callRef.current?.startRecording();
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !callRef.current) return;
    
    callRef.current.sendAppMessage({ message: chatInput }, '*');
    setMessages(prev => [...prev, {
      sender: 'أنت',
      text: chatInput,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    }]);
    setChatInput('');
  };

  const endSession = async () => {
    const confirmed = window.confirm(
      'هل تريد إنهاء جلسة الاستشارة؟\nسيتم حفظ الملاحظات تلقائياً في القضية.'
    );
    if (!confirmed) return;

    if (callRef.current) {
      await callRef.current.leave();
    }

    if (sessionId) {
      try {
        // ✅ BUG-001 FIX: استخدام apiPost مع Authorization header
        await apiPost('/api/video/end-session', {
          sessionId,
          notes,
          chatLog: JSON.stringify(messages),
          durationSeconds: duration
        });
      } catch (err) {
        console.error("Failed to save session data:", err);
      }
    }

    navigate(`/dashboard/cases/${caseId}`);
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col gap-4">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">غرفة الاستشارة المرئية</h1>
            <p className="text-sm text-gray-500">القضية #{caseId}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100">
            <span className={`w-2.5 h-2.5 rounded-full ${isJoined ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
            <span className="text-sm font-medium text-slate-700 font-mono" dir="ltr">
              {formatDuration(duration)}
            </span>
          </div>
          <Button variant="destructive" onClick={endSession} className="gap-2">
            <PhoneOff className="w-4 h-4" />
            إنهاء الجلسة
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        
        {/* Video Area */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex-1 bg-slate-900 rounded-2xl overflow-hidden relative border border-slate-800 shadow-inner">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center text-white z-10 bg-slate-900/80">
                جاري إعداد غرفة الاتصال...
              </div>
            )}
            <div ref={videoContainerRef} className="w-full h-full absolute inset-0" />
            
            {/* Overlay Controls */}
            {isJoined && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-slate-900/80 backdrop-blur border border-slate-700 p-2 rounded-2xl">
                <Button 
                  variant={isMicOn ? "secondary" : "destructive"} 
                  size="icon" 
                  onClick={toggleMic}
                  className="rounded-xl w-12 h-12"
                >
                  {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </Button>
                <Button 
                  variant={isCamOn ? "secondary" : "destructive"} 
                  size="icon" 
                  onClick={toggleCam}
                  className="rounded-xl w-12 h-12"
                >
                  {isCamOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </Button>
                <div className="w-px h-8 bg-slate-700 mx-1"></div>
                <Button 
                  variant={isSharing ? "default" : "secondary"} 
                  size="icon" 
                  onClick={toggleShare}
                  className="rounded-xl w-12 h-12"
                >
                  <MonitorUp className="w-5 h-5" />
                </Button>
                <Button 
                  variant={isRecording ? "destructive" : "secondary"} 
                  size="icon" 
                  onClick={toggleRecording}
                  className="rounded-xl w-12 h-12"
                >
                  {isRecording ? <StopCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                </Button>
              </div>
            )}
          </div>
          
          {/* Status Footer */}
          <div className="bg-white rounded-2xl border border-gray-100 p-3 flex items-center justify-between text-sm">
            <span className="text-gray-600">محكمة شمال القاهرة — جلسة مرافعة</span>
            {isRecording && (
              <span className="flex items-center gap-2 text-red-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                جاري تسجيل الجلسة
              </span>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full">
            <div className="p-2 border-b border-gray-100">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="case" className="gap-2">
                  <FileText className="w-4 h-4" />
                  القضية
                </TabsTrigger>
                <TabsTrigger value="chat" className="gap-2">
                  <MessageSquare className="w-4 h-4" />
                  دردشة
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="case" className="flex-1 flex flex-col p-4 m-0 overflow-hidden">
              <div className="flex-1 flex flex-col gap-4 min-h-0">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 shrink-0">
                  <h3 className="font-bold text-gray-800 mb-1">تفاصيل الموكل</h3>
                  <p className="text-sm text-gray-600">الاسم: غير محدد</p>
                  <p className="text-sm text-gray-600">الرقم: غير محدد</p>
                </div>
                
                <div className="flex-1 flex flex-col min-h-0">
                  <label className="text-sm font-bold text-gray-700 mb-2">ملاحظات الجلسة</label>
                  <Textarea 
                    placeholder="اكتب ملاحظاتك هنا أثناء الاستشارة... سيتم حفظها تلقائياً في ملف القضية."
                    className="flex-1 resize-none bg-amber-50/30"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                
                <Button className="w-full gap-2 shrink-0 bg-indigo-600 hover:bg-indigo-700">
                  <Save className="w-4 h-4" />
                  حفظ في ملف القضية
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="chat" className="flex-1 flex flex-col p-4 m-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-gray-400 text-center">
                    لا توجد رسائل بعد.<br/>ابدأ المحادثة الآن.
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.sender === 'أنت' ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] text-gray-400 mb-1 px-1">{msg.sender}</span>
                      <div className={`px-3 py-2 rounded-xl text-sm ${msg.sender === 'أنت' ? 'bg-indigo-600 text-white rounded-tl-none' : 'bg-slate-100 text-gray-800 rounded-tr-none'}`}>
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.time}</span>
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={handleSendMessage} className="flex gap-2 shrink-0">
                <Input 
                  placeholder="اكتب رسالة..." 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="icon" disabled={!chatInput.trim()} className="shrink-0 bg-indigo-600 hover:bg-indigo-700">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
