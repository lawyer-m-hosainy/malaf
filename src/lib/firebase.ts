/**
 * Firebase — يُستخدم للمصادقة (Auth) فقط.
 * قاعدة البيانات: Supabase (انظر src/lib/supabase.ts)
 */
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
