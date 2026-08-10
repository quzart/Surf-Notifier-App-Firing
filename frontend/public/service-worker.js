self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Surf Notifier";
  const body = data.body || "";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/vite.svg",
      badge: "/vite.svg",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/"));
});