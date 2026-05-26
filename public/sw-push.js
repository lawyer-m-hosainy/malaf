// ═══════════════════════════════════════════════════════════════
// Malaf Push Notification Service Worker
// يتعامل مع استقبال وعرض الإشعارات الفورية (Push Notifications)
// ═══════════════════════════════════════════════════════════════

// استقبال الـ Push Event من السيرفر
self.addEventListener('push', function (event) {
  var defaultData = {
    title: 'مَلَف — تنبيه',
    body: 'لديك إشعار جديد',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    url: '/dashboard',
    tag: 'malaf-notification',
  };

  var data = defaultData;

  if (event.data) {
    try {
      var payload = event.data.json();
      data = Object.assign({}, defaultData, payload);
    } catch (e) {
      data.body = event.data.text();
    }
  }

  var options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    dir: 'rtl',
    lang: 'ar',
    vibrate: [200, 100, 200],
    data: { url: data.url },
    actions: [
      { action: 'open', title: 'فتح التطبيق' },
      { action: 'dismiss', title: 'تجاهل' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// عند الضغط على الإشعار → فتح التطبيق
self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  if (event.action === 'dismiss') return;

  var targetUrl = (event.notification.data && event.notification.data.url) || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if ('focus' in client) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
