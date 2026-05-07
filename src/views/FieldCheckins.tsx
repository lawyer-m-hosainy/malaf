import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  MapPin, Navigation, Clock, CheckCircle2, XCircle, 
  Users2, Plus, Search, Building2, Landmark, Home, 
  AlertTriangle, Smartphone, Globe, QrCode, RefreshCw, Trash2
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useTeamStore } from '@/store/useTeamStore';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface CheckIn {
  id: string;
  user_name: string;
  user_role: string;
  latitude: number;
  longitude: number;
  matched_location_name: string | null;
  distance_meters: number | null;
  is_verified: boolean;
  checkin_type: string;
  source: string;
  notes: string | null;
  created_at: string;
}

interface KnownLocation {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  address: string | null;
}

const roleLabels: Record<string, string> = {
  lawyer: 'محامي',
  trainee: 'محامي متدرب',
  secretary: 'سكرتيرة',
  representative: 'مندوب',
  admin: 'مدير',
};

const typeIcons: Record<string, any> = {
  court: Landmark,
  office: Building2,
  registry: Home,
  other: MapPin,
};

const sourceLabels: Record<string, { label: string; icon: any }> = {
  app: { label: 'التطبيق', icon: Smartphone },
  whatsapp: { label: 'واتساب', icon: Globe },
  qr_code: { label: 'QR Code', icon: QrCode },
};

export default function FieldCheckins() {
  const orgId = useAuthStore(s => s.orgId);
  const teamMembers = useTeamStore(s => s.teamMembers);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [locations, setLocations] = useState<KnownLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'live' | 'history' | 'locations'>('live');
  const [isCheckinOpen, setIsCheckinOpen] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // New location form
  const [newLocName, setNewLocName] = useState('');
  const [newLocType, setNewLocType] = useState('court');
  const [newLocAddress, setNewLocAddress] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    // Demo data since we can't connect to Supabase directly from frontend without setup
    const demoCheckins: CheckIn[] = [
      { id: '1', user_name: 'أحمد محمد', user_role: 'lawyer', latitude: 30.0444, longitude: 31.2357, matched_location_name: 'محكمة شمال القاهرة', distance_meters: 45, is_verified: true, checkin_type: 'arrival', source: 'app', notes: 'جلسة الاستئناف', created_at: new Date(Date.now() - 1800000).toISOString() },
      { id: '2', user_name: 'سارة علي', user_role: 'secretary', latitude: 30.0500, longitude: 31.2400, matched_location_name: 'المكتب الرئيسي', distance_meters: 12, is_verified: true, checkin_type: 'arrival', source: 'whatsapp', notes: null, created_at: new Date(Date.now() - 10800000).toISOString() },
      { id: '3', user_name: 'محمد خالد', user_role: 'representative', latitude: 30.0600, longitude: 31.2500, matched_location_name: null, distance_meters: 850, is_verified: false, checkin_type: 'arrival', source: 'whatsapp', notes: 'الشهر العقاري — فرع مصر الجديدة', created_at: new Date(Date.now() - 7200000).toISOString() },
      { id: '4', user_name: 'خالد إبراهيم', user_role: 'trainee', latitude: 0, longitude: 0, matched_location_name: null, distance_meters: null, is_verified: false, checkin_type: 'arrival', source: 'app', notes: null, created_at: new Date(Date.now() - 86400000).toISOString() },
    ];

    const demoLocations: KnownLocation[] = [
      { id: 'loc1', name: 'محكمة شمال القاهرة', type: 'court', latitude: 30.0444, longitude: 31.2357, radius_meters: 200, address: 'شارع 26 يوليو، وسط البلد' },
      { id: 'loc2', name: 'المكتب الرئيسي', type: 'office', latitude: 30.0500, longitude: 31.2400, radius_meters: 100, address: 'شارع التحرير، الدقي' },
      { id: 'loc3', name: 'محكمة جنوب القاهرة', type: 'court', latitude: 30.0300, longitude: 31.2300, radius_meters: 200, address: 'ميدان لاظوغلي' },
      { id: 'loc4', name: 'الشهر العقاري — مصر الجديدة', type: 'registry', latitude: 30.0800, longitude: 31.3200, radius_meters: 150, address: 'شارع الحجاز' },
    ];

    setCheckins(demoCheckins);
    setLocations(demoLocations);
    setIsLoading(false);
  };

  const handleSelfCheckin = useCallback(() => {
    setGpsStatus('loading');
    if (!navigator.geolocation) {
      setGpsStatus('error');
      toast.error('المتصفح لا يدعم GPS');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsStatus('success');
        const { latitude, longitude, accuracy } = position.coords;
        
        // Find nearest known location
        let nearest: KnownLocation | null = null;
        let minDist = Infinity;
        for (const loc of locations) {
          const dist = haversineDistance(latitude, longitude, loc.latitude, loc.longitude);
          if (dist < minDist) { minDist = dist; nearest = loc; }
        }

        const isVerified = nearest && minDist <= nearest.radius_meters;
        
        const newCheckin: CheckIn = {
          id: `self-${Date.now()}`,
          user_name: 'أنت',
          user_role: 'admin',
          latitude, longitude,
          matched_location_name: isVerified ? nearest!.name : null,
          distance_meters: Math.round(minDist),
          is_verified: !!isVerified,
          checkin_type: 'arrival',
          source: 'app',
          notes: isVerified ? null : `أقرب موقع: ${nearest?.name || 'غير محدد'} (${Math.round(minDist)} متر)`,
          created_at: new Date().toISOString(),
        };

        setCheckins(prev => [newCheckin, ...prev]);
        toast.success(isVerified 
          ? `✅ تم التحقق — ${nearest!.name}` 
          : `⚠️ تم التسجيل — موقع غير معروف (دقة: ${Math.round(accuracy)}م)`
        );
        setIsCheckinOpen(false);
      },
      (error) => {
        setGpsStatus('error');
        toast.error('فشل في الحصول على الموقع — تأكد من تفعيل GPS');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [locations]);

  const todayCheckins = checkins.filter(c => {
    const d = new Date(c.created_at);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });

  const stats = {
    totalToday: todayCheckins.length,
    verified: todayCheckins.filter(c => c.is_verified).length,
    unverified: todayCheckins.filter(c => !c.is_verified).length,
    locations: locations.length,
  };

  const timeAgo = (dateStr: string) => {
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (mins < 1) return 'الآن';
    if (mins < 60) return `منذ ${mins} دقيقة`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    return `منذ ${Math.floor(hours / 24)} يوم`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            أين فريقي؟
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            تتبع الحضور الميداني لفريق العمل — محاكم ومكاتب ومأموريات
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadData} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            تحديث
          </Button>
          <Button size="sm" onClick={() => setIsCheckinOpen(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
            <Navigation className="w-4 h-4" />
            تسجيل وصولي
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'تسجيلات اليوم', value: stats.totalToday, color: 'indigo', icon: MapPin },
          { label: 'تم التحقق', value: stats.verified, color: 'emerald', icon: CheckCircle2 },
          { label: 'بدون تحقق', value: stats.unverified, color: 'amber', icon: AlertTriangle },
          { label: 'مواقع مسجلة', value: stats.locations, color: 'purple', icon: Building2 },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className={`bg-gradient-to-br from-${stat.color}-50 to-white dark:from-${stat.color}-950/30 dark:to-gray-900 border-${stat.color}-100 dark:border-${stat.color}-800/30`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs text-${stat.color}-600 dark:text-${stat.color}-400 font-medium`}>{stat.label}</p>
                    <p className={`text-2xl font-bold text-${stat.color}-700 dark:text-${stat.color}-300 mt-1`}>{stat.value}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 text-${stat.color}-300 dark:text-${stat.color}-700`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Self Check-in Modal */}
      <AnimatePresence>
        {isCheckinOpen && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
            <Card className="border-2 border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/30 dark:bg-emerald-950/10">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
                  <Navigation className={`w-8 h-8 text-emerald-600 ${gpsStatus === 'loading' ? 'animate-pulse' : ''}`} />
                </div>
                <h3 className="font-bold text-gray-800 dark:text-white text-lg">تسجيل الحضور الميداني</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">سيتم تحديد موقعك الحالي والتحقق منه تلقائياً</p>
                <div className="flex justify-center gap-3">
                  <Button variant="outline" onClick={() => setIsCheckinOpen(false)}>إلغاء</Button>
                  <Button 
                    onClick={handleSelfCheckin} 
                    disabled={gpsStatus === 'loading'}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <MapPin className="w-4 h-4" />
                    {gpsStatus === 'loading' ? 'جاري تحديد الموقع...' : 'تأكيد وتسجيل'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        {[
          { id: 'live' as const, label: 'الحضور اليوم', count: todayCheckins.length },
          { id: 'history' as const, label: 'السجل الكامل', count: checkins.length },
          { id: 'locations' as const, label: 'المواقع المسجلة', count: locations.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id 
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Live / History Tab */}
      {(activeTab === 'live' || activeTab === 'history') && (
        <div className="space-y-3">
          {(activeTab === 'live' ? todayCheckins : checkins).map((checkin, i) => {
            const SourceIcon = sourceLabels[checkin.source]?.icon || Smartphone;
            return (
              <motion.div key={checkin.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="hover:shadow-md transition-shadow dark:bg-gray-900/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                          checkin.is_verified 
                            ? 'bg-emerald-100 dark:bg-emerald-900/30' 
                            : 'bg-amber-100 dark:bg-amber-900/30'
                        }`}>
                          {checkin.is_verified 
                            ? <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                            : <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                          }
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-gray-800 dark:text-white text-sm">{checkin.user_name}</p>
                            <Badge variant="outline" className="text-[10px]">{roleLabels[checkin.user_role] || checkin.user_role}</Badge>
                            <Badge variant="outline" className={`text-[10px] gap-1 ${checkin.is_verified ? 'text-emerald-600 border-emerald-200' : 'text-amber-600 border-amber-200'}`}>
                              {checkin.is_verified ? '✓ تم التحقق' : '⚠ غير متحقق'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                            {checkin.matched_location_name && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {checkin.matched_location_name}
                              </span>
                            )}
                            {checkin.distance_meters != null && checkin.distance_meters > 0 && (
                              <span className="flex items-center gap-1">
                                <Navigation className="w-3 h-3" />
                                {checkin.distance_meters} متر
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <SourceIcon className="w-3 h-3" />
                              {sourceLabels[checkin.source]?.label || checkin.source}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {timeAgo(checkin.created_at)}
                            </span>
                          </div>
                          {checkin.notes && (
                            <p className="text-xs text-gray-400 mt-1">📋 {checkin.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}

          {(activeTab === 'live' ? todayCheckins : checkins).length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <MapPin className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">لا توجد تسجيلات {activeTab === 'live' ? 'اليوم' : 'بعد'}</p>
            </div>
          )}
        </div>
      )}

      {/* Locations Tab */}
      {activeTab === 'locations' && (
        <div className="space-y-4">
          {/* Add Location */}
          <Card className="border-dashed border-2 border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <h3 className="font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                إضافة موقع جديد
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input placeholder="اسم الموقع (مثل: محكمة عابدين)" value={newLocName} onChange={e => setNewLocName(e.target.value)} />
                <select value={newLocType} onChange={e => setNewLocType(e.target.value)} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm">
                  <option value="court">محكمة</option>
                  <option value="office">مكتب</option>
                  <option value="registry">شهر عقاري</option>
                  <option value="other">أخرى</option>
                </select>
                <Button 
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={!newLocName}
                  onClick={() => {
                    // Use browser GPS to get current location as the new location coordinates
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        const newLoc: KnownLocation = {
                          id: `loc-${Date.now()}`,
                          name: newLocName,
                          type: newLocType,
                          latitude: pos.coords.latitude,
                          longitude: pos.coords.longitude,
                          radius_meters: 200,
                          address: newLocAddress || null,
                        };
                        setLocations(prev => [...prev, newLoc]);
                        setNewLocName('');
                        setNewLocAddress('');
                        toast.success(`✅ تم إضافة "${newLocName}" — موقعك الحالي هو الإحداثيات`);
                      },
                      () => toast.error('فشل في تحديد الموقع — شغّل GPS')
                    );
                  }}
                >
                  <MapPin className="w-4 h-4" />
                  إضافة (موقعي الحالي)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Locations List */}
          {locations.map((loc, i) => {
            const TypeIcon = typeIcons[loc.type] || MapPin;
            return (
              <motion.div key={loc.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="dark:bg-gray-900/50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <TypeIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 dark:text-white text-sm">{loc.name}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          <span>📍 {loc.address || 'بدون عنوان'}</span>
                          <span>📏 نطاق {loc.radius_meters} متر</span>
                          <Badge variant="outline" className="text-[10px]">{
                            loc.type === 'court' ? 'محكمة' : 
                            loc.type === 'office' ? 'مكتب' : 
                            loc.type === 'registry' ? 'شهر عقاري' : 'أخرى'
                          }</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Haversine distance (meters) ──
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
