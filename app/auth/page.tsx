"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Language = "sw" | "en";
type Screen = "home" | "login" | "register";
type RegisterStep = "role" | "region" | "details";

const roles = [
  { id: "farmer", icon: "👨🏾‍🌾", sw: "Mkulima", en: "Farmer" },
  { id: "livestock", icon: "🐄", sw: "Mfugaji", en: "Livestock Keeper" },
  { id: "buyer", icon: "🛒", sw: "Mnunuzi", en: "Buyer" },
  { id: "seller", icon: "🧰", sw: "Muuzaji wa Vifaa", en: "Equipment Seller" },
];

const regions = [
  "Arusha",
  "Dar es Salaam",
  "Dodoma",
  "Geita",
  "Iringa",
  "Kagera",
  "Katavi",
  "Kigoma",
  "Kilimanjaro",
  "Lindi",
  "Manyara",
  "Mara",
  "Mbeya",
  "Morogoro",
  "Mtwara",
  "Mwanza",
  "Njombe",
  "Pwani",
  "Rukwa",
  "Ruvuma",
  "Shinyanga",
  "Simiyu",
  "Singida",
  "Songwe",
  "Tabora",
  "Tanga",
];

export default function AuthPage() {
  const router = useRouter();
async function loginUser() {
  if (!email || !password) {
    return;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert(`Kuingia kumeshindikana: ${error.message}`);
    return;
  }

  const userRole = data.user?.app_metadata?.role || data.user?.user_metadata?.role;

  if (userRole === "admin") {
    router.push("/admin");
    return;
  }

  router.push("/dashboard");
}
  async function registerUser() {
    if (!fullName || !phone || !email || !password || !selectedRole || !region) {
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
          role: selectedRole,
          region,
        },
      },
    });

    if (error) {
      alert(`Usajili umeshindikana: ${error.message}`);
      return;
    }

    if (data.user) {
      router.push("/dashboard");
    }
  }
  const [language, setLanguage] = useState<Language>("sw");
  const [screen, setScreen] = useState<Screen>("home");
  const [step, setStep] = useState<RegisterStep>("role");

  const [selectedRole, setSelectedRole] = useState("");
  const [region, setRegion] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("agrofuture_language");

    if (saved === "sw" || saved === "en") {
      setLanguage(saved);
    }
  }, []);

  function changeLanguage(value: Language) {
    setLanguage(value);
    localStorage.setItem("agrofuture_language", value);
  }

  function openRegister() {
    setScreen("register");
    setStep("role");
    setSelectedRole("");
    setRegion("");
  }

  function back() {
    if (screen === "login" || screen === "register") {
      setScreen("home");
      return;
    }

    if (step === "region") {
      setStep("role");
      return;
    }

    if (step === "details") {
      setStep("region");
    }
  }

  const sw = language === "sw";

  return (
    <main className="min-h-screen bg-[#F8FAF5] px-5 py-8 text-[#173B2A]">
      <div className="mx-auto min-h-[90vh] w-full max-w-md">

        {/* LANGUAGE */}
        <div className="flex justify-end">
          <div className="rounded-full border border-[#DCE9DF] bg-white p-1 shadow-sm">
            <button
              onClick={() => changeLanguage("sw")}
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                sw ? "bg-[#2F9E5B] text-white" : "text-[#718578]"
              }`}
            >
              🇹🇿 SW
            </button>

            <button
              onClick={() => changeLanguage("en")}
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                !sw ? "bg-[#2F9E5B] text-white" : "text-[#718578]"
              }`}
            >
              🇬🇧 EN
            </button>
          </div>
        </div>

        {/* LOGO */}
        <div className="pt-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#2F9E5B] shadow-lg">
            <span className="text-3xl">🌱</span>
          </div>

          <h1 className="mt-5 text-3xl font-black">
            AGRO<span className="text-[#2F9E5B]">FUTURE</span>
          </h1>

          <p className="text-xs font-bold tracking-[0.35em] text-[#718578]">
            2050
          </p>
        </div>

        {/* HOME */}
        {screen === "home" && (
          <section className="mt-10 text-center">
            <h2 className="text-2xl font-black">
              {sw ? "Karibu!" : "Welcome!"}
            </h2>

            <p className="mt-2 text-sm text-[#718578]">
              {sw
                ? "Jukwaa la kilimo, ufugaji na biashara."
                : "A platform for agriculture, livestock and business."}
            </p>

            <div className="mt-8 space-y-3">
              <button
                onClick={() => setScreen("login")}
                className="w-full rounded-2xl border border-[#DCE9DF] bg-white py-4 font-bold text-[#2F9E5B] shadow-sm"
              >
                {sw ? "Ingia" : "Login"}
              </button>

              <button
                onClick={openRegister}
                className="w-full rounded-2xl bg-[#2F9E5B] py-4 font-bold text-white shadow-lg"
              >
                {sw ? "Jisajili" : "Register"}
              </button>
            </div>
          </section>
        )}

{/* LOGIN */}
{screen === "login" && (
  <section className="mt-10">
    <button
      onClick={() => setScreen("home")}
      className="mb-6 text-sm font-bold text-[#2F9E5B]"
    >
      ← {sw ? "Rudi" : "Back"}
    </button>

    <h2 className="text-3xl font-black">
      {sw ? "Karibu tena 👋" : "Welcome back 👋"}
    </h2>

    <p className="mt-2 text-sm text-[#718578]">
      {sw ? "Ingia kwenye akaunti yako." : "Sign in to your account."}
    </p>

    <div className="mt-8 space-y-5">
      <div>
        <label className="text-sm font-bold">
          {sw ? "Email" : "Email"}
        </label>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-white px-4 py-4 outline-none focus:border-[#2F9E5B]"
        />
      </div>

      <div>
        <label className="text-sm font-bold">
          {sw ? "Password" : "Password"}
        </label>

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-white px-4 py-4 pr-14 outline-none focus:border-[#2F9E5B]"
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-lg"
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>
      </div>

      <button
        onClick={loginUser}
        disabled={!email || !password}
        className="w-full rounded-2xl bg-[#2F9E5B] py-4 font-bold text-white shadow-lg disabled:opacity-40"
      >
        {sw ? "Ingia →" : "Login →"}
      </button>
    </div>

    <p className="mt-7 text-center text-sm text-[#718578]">
      {sw ? "Huna akaunti?" : "Don't have an account?"}{" "}
      <button
        onClick={openRegister}
        className="font-bold text-[#2F9E5B]"
      >
        {sw ? "Jisajili" : "Register"}
      </button>
    </p>
  </section>
)}
        {/* REGISTER */}
        {screen === "register" && (
          <section className="mt-10">
            <button
              onClick={back}
              className="mb-6 text-sm font-bold text-[#2F9E5B]"
            >
              ← {sw ? "Rudi" : "Back"}
            </button>

            {/* ROLE */}
            {step === "role" && (
              <>
                <p className="text-xs font-bold uppercase tracking-widest text-[#2F9E5B]">
                  {sw ? "Hatua 1 / 3" : "Step 1 / 3"}
                </p>

                <h2 className="mt-2 text-3xl font-black">
                  {sw ? "Chagua nafasi" : "Choose your role"}
                </h2>

                <div className="mt-7 space-y-3">
                  {roles.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => setSelectedRole(role.id)}
                      className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left ${
                        selectedRole === role.id
                          ? "border-[#2F9E5B] bg-[#EAF7ED]"
                          : "border-[#DCE9DF] bg-white"
                      }`}
                    >
                      <span className="text-2xl">{role.icon}</span>

                      <div className="flex-1">
                        <p className="font-bold">
                          {sw ? role.sw : role.en}
                        </p>
                      </div>

                      {selectedRole === role.id && (
                        <span className="font-black text-[#2F9E5B]">✓</span>
                      )}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setStep("region")}
                  disabled={!selectedRole}
                  className="mt-7 w-full rounded-2xl bg-[#2F9E5B] py-4 font-bold text-white shadow-lg disabled:opacity-40"
                >
                  {sw ? "Endelea →" : "Continue →"}
                </button>
              </>
            )}

            {/* REGION */}
            {step === "region" && (
              <>
                <p className="text-xs font-bold uppercase tracking-widest text-[#2F9E5B]">
                  {sw ? "Hatua 2 / 3" : "Step 2 / 3"}
                </p>

                <h2 className="mt-2 text-3xl font-black">
                  {sw ? "Chagua Kanda 📍" : "Choose your Region 📍"}
                </h2>

                <p className="mt-2 text-sm text-[#718578]">
                  {sw
                    ? "Chagua eneo lako."
                    : "Select your location."}
                </p>

                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="mt-7 w-full rounded-2xl border border-[#DCE9DF] bg-white px-4 py-4 outline-none focus:border-[#2F9E5B]"
                >
                  <option value="">
                    {sw ? "Chagua Kanda" : "Choose Region"}
                  </option>

                  {regions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setStep("details")}
                  disabled={!region}
                  className="mt-7 w-full rounded-2xl bg-[#2F9E5B] py-4 font-bold text-white shadow-lg disabled:opacity-40"
                >
                  {sw ? "Endelea →" : "Continue →"}
                </button>
              </>
            )}

            {/* DETAILS */}
            {step === "details" && (
              <>
                <p className="text-xs font-bold uppercase tracking-widest text-[#2F9E5B]">
                  {sw ? "Hatua 3 / 3" : "Step 3 / 3"}
                </p>

                <h2 className="mt-2 text-3xl font-black">
                  {sw ? "Taarifa zako" : "Your details"}
                </h2>

                <div className="mt-7 space-y-5">
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={sw ? "Jina kamili" : "Full name"}
                    className="w-full rounded-2xl border border-[#DCE9DF] bg-white px-4 py-4 outline-none focus:border-[#2F9E5B]"
                  />

                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={sw ? "Namba ya simu" : "Phone number"}
                    className="w-full rounded-2xl border border-[#DCE9DF] bg-white px-4 py-4 outline-none focus:border-[#2F9E5B]"
                  />

                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="Email"
                    className="w-full rounded-2xl border border-[#DCE9DF] bg-white px-4 py-4 outline-none focus:border-[#2F9E5B]"
                  />

                  <div className="relative">
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type={showPassword ? "text" : "password"}
                      placeholder={sw ? "Password" : "Password"}
                      className="w-full rounded-2xl border border-[#DCE9DF] bg-white px-4 py-4 pr-14 outline-none focus:border-[#2F9E5B]"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-lg"
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                <button
onClick={registerUser}
                  disabled={!fullName || !phone || !email || !password}
                  className="mt-7 w-full rounded-2xl bg-[#2F9E5B] py-4 font-bold text-white shadow-lg disabled:opacity-40"
                >
                  {sw ? "Kamilisha Usajili ✓" : "Complete Registration ✓"}
                </button>
              </>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
