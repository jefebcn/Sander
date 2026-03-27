// Sander — Push notification service worker

self.addEventListener("push", function (event) {
  const data = event.data ? event.data.json() : {}
  const title = data.title ?? "Sander"
  const options = {
    body: data.body ?? "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [200, 100, 200],
    data: { url: data.url ?? "/" },
    actions: data.actions ?? [],
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener("notificationclick", function (event) {
  event.notification.close()
  const url = event.notification.data?.url ?? "/"
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === url && "focus" in client) return client.focus()
        }
        return clients.openWindow(url)
      })
  )
})
