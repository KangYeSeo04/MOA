import { SignupPage } from "../components/signup";
import { router } from "expo-router";

export default function SignupScreen() {
  return <SignupPage onNavigateToLogin={() => router.replace("/login")} />;
}