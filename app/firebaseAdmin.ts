import admin from "firebase-admin";

function getPrivateKey() {
  const key = process.env.FIREBASE_PRIVATE_KEY;

  if (!key) {
    throw new Error("FIREBASE_PRIVATE_KEY não definida");
  }

  return key.replace(/\\n/g, "\n");
}

function getProjectId() {
  const value = process.env.FIREBASE_PROJECT_ID;
  if (!value) {
    throw new Error("FIREBASE_PROJECT_ID não definido");
  }
  return value;
}

function getClientEmail() {
  const value = process.env.FIREBASE_CLIENT_EMAIL;
  if (!value) {
    throw new Error("FIREBASE_CLIENT_EMAIL não definido");
  }
  return value;
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: getProjectId(),
      clientEmail: getClientEmail(),
      privateKey: getPrivateKey(),
    }),
  });
}

const adminDb = admin.firestore();

export { admin, adminDb };