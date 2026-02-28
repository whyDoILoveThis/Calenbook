import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-slate-950 via-slate-900 to-purple-950">
      <SignUp
        appearance={{
          elements: {
            card: "glass-panel",
            formButtonPrimary: "primary-button py-3 rounded-xl text-base",
            formFieldInput: "glass-input",
            headerTitle: "text-white/90 font-light",
            headerSubtitle: "text-white/60",
            socialButtonsBlockButton: "glass-button",
            dividerRow: "border-white/10",
            footerAction: "text-white/60",
          },
        }}
      />
      <div className="mt-6 flex justify-center">
        <Link
          href="/sign-in"
          className="glass-button px-6 py-2 rounded-xl text-base text-white/80 hover:bg-white/10 transition"
        >
          Already have an account? Sign in
        </Link>
      </div>
    </div>
  );
}
