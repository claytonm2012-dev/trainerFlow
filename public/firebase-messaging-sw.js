importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCATXvmjnPUZVqlorH00JpLpsL2l90LF2s",
  authDomain: "trainerflow-a2d97.firebaseapp.com",
  projectId: "trainerflow-a2d97",
  storageBucket: "trainerflow-a2d97.firebasestorage.app",
  messagingSenderId: "305079417637",
  appId: "1:305079417637:web:7e94d58c8c0ca71f5378cc",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  console.log("Mensagem recebida em background:", payload);

  const notificationTitle =
    payload.notification?.title || "TrainerFlow";

  const notificationOptions = {
    body: payload.notification?.body || "Você tem uma nova notificação.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: payload.data || {},
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});