import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950">
      <SignIn
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
    </div>
  );
}
