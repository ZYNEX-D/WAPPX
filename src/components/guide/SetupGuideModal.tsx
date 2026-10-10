"use client";

import React, { useState } from "react";
import {
  X,
  ExternalLink,
  CheckCircle2,
  Copy,
  Check,
  ShieldAlert,
  Sparkles,
  BookOpen,
  ArrowRight,
  Globe,
  Zap,
} from "lucide-react";

interface SetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  webhookUrl: string;
  verifyToken: string;
}

export function SetupGuideModal({
  isOpen,
  onClose,
  webhookUrl,
  verifyToken,
}: SetupGuideModalProps) {
  const [lang, setLang] = useState<"si" | "en">("en");
  const [activeStep, setActiveStep] = useState(1);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (text: string, type: "webhook" | "token") => {
    navigator.clipboard.writeText(text);
    if (type === "webhook") {
      setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 2000);
    } else {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const stepsContent = {
    si: [
      {
        step: 1,
        title: "Meta Developer App එකක් සාදාගැනීම",
        badge: "මූලික පියවර",
        desc: "WhatsApp Business Cloud API භාවිතා කිරීමට Meta Developer ගිණුමක් අවශ්‍ය වේ.",
        instructions: [
          "developers.facebook.com වෙත ගොස් ඔබගේ Facebook ගිණුමෙන් ලොග් වන්න.",
          "ඉහළ දකුණු කෙළවරේ ඇති 'My Apps' click කර 'Create App' තෝරන්න.",
          "Use case සඳහා 'Other' තෝරා ඊළඟට 'Business' වර්ගය තෝරන්න.",
          "App Name එකක් (උදා: WPPX Hub) සහ ඔබගේ Business Account එක තෝරා 'Create app' click කරන්න.",
          "Add products ලැයිස්තුවෙන් 'WhatsApp' සොයා 'Set up' click කරන්න.",
        ],
        link: "https://developers.facebook.com/apps/",
        linkText: "Meta Developer Console වෙත යන්න",
      },
      {
        step: 2,
        title: "WhatsApp Phone Number එකක් Register කිරීම",
        badge: "දුරකථන අංකය",
        desc: "ඔබගේ Business WhatsApp අංකය Meta Cloud API වෙත සම්බන්ධ කිරීම.",
        instructions: [
          "Meta App එකේ වම් පස මෙනුවෙන් 'WhatsApp' -> 'Production setup' (හෝ API Setup) වෙත යන්න.",
          "'Add phone number' click කරන්න.",
          "Business Display Name එකක් (උදා: WPPX Store) සහ Timezone එක තෝරන්න.",
          "ඔබගේ Phone Number එක ඇතුළත් කර SMS OTP එකක් මගින් Verify කරගන්න.",
          "වැදගත්: මෙම අංකය දැනට සාමාන්‍ය WhatsApp mobile app එකක active නම්, API එකට සම්බන්ධ කිරීමට පෙර mobile app එකෙන් delete කළ යුතුය (වෙනම අලුත් SIM එකක් භාවිතා කිරීම වඩාත් නිර්දේශ කෙරේ).",
        ],
        link: "https://developers.facebook.com",
        linkText: "Meta WhatsApp Production Setup",
      },
      {
        step: 3,
        title: "Permanent Access Token එකක් සාදාගැනීම",
        badge: "ආරක්ෂිත Token",
        desc: "කල් ඉකුත් නොවන (Never expiring) System User Token එකක් සාදාගැනීම.",
        instructions: [
          "business.facebook.com/settings වෙත ගොස් 'Users' -> 'System users' තෝරන්න.",
          "'Add' click කර Admin system user කෙනෙක් සාදන්න (උදා: WPPXBotAdmin).",
          "සාදන ලද System User මත click කර 'Assign assets' යන්න -> 'Apps' යටතේ ඔබගේ Meta App එක තෝරා 'Manage app' (Full control) ලබා දෙන්න.",
          "දැන් 'Generate token' click කර ඔබගේ App එක තෝරන්න.",
          "Token Expiration එකට 'Never' තෝරන්න.",
          "Permissions ලැයිස්තුවෙන් whatsapp_business_messaging සහ whatsapp_business_management යන දෙක tick කර Token එක generate කර copy කරගන්න.",
        ],
        link: "https://business.facebook.com/settings/system-users",
        linkText: "Meta Business Settings System Users වෙත යන්න",
      },
      {
        step: 4,
        title: "Inbound Webhook එක Configure කිරීම",
        badge: "Real-time Messaging",
        desc: "පාරිභෝගිකයින් එවන පණිවිඩ WPPX පද්ධතියට ක්ෂණිකව ලබාගැනීමට Webhook සකස් කිරීම.",
        instructions: [
          "Meta Developer Console හි 'WhatsApp' -> 'Configuration' (හෝ Tools > Webhooks) වෙත යන්න.",
          "Callback URL සහ Verify Token යන තැන්වලට පහත දක්වා ඇති ඔබගේ පුද්ගලික අගයන් ඇතුළත් කරන්න:",
        ],
        link: "https://developers.facebook.com",
        linkText: "Meta Webhooks වෙත යන්න",
        hasWebhookFields: true,
      },
      {
        step: 5,
        title: "WPPX Dashboard එකට Connect වීම",
        badge: "අවසන් පියවර",
        desc: "1-Click Auto-Detect හරහා ඔබගේ WhatsApp අංකය සම්බන්ධ කිරීම.",
        instructions: [
          "WPPX Hub හි 'Meta API' tab එකේ ඇති '1-Click Auto Setup' වෙත යන්න.",
          "පියවර 3 හිදී ලබාගත් Permanent Access Token එක paste කරන්න.",
          "'Auto-Detect My WhatsApp Numbers' click කරන්න.",
          "ඔබගේ Phone Number එක දිස්වූ පසු 'Connect This Number' click කරන්න. Webhook එකද ස්වයංක්‍රීයව subscribe වනු ඇත!",
          "දැන් පද්ධතිය 100% සූදානම්! වෙනත් දුරකථනයකින් ඔබගේ WhatsApp අංකයට 'Hi' කියා පණිවිඩයක් යවා පරීක්ෂා කරන්න.",
        ],
      },
      {
        step: 6,
        title: "Instagram සහ Facebook Messenger සම්බන්ධ කිරීම",
        badge: "සමාජ මාධ්‍ය",
        desc: "Facebook Messenger සහ Instagram Direct පණිවිඩ WPPX පද්ධතියට සම්බන්ධ කිරීම.",
        instructions: [
          "1. Instagram Professional කිරීම: Instagram mobile app එක විවෘත කර Settings & privacy -> Account type and tools -> Switch to professional account තෝරන්න.",
          "2. Instagram DM Access සක්‍රිය කිරීම: Instagram app එකේ Settings & privacy -> Messages and story replies -> Message controls -> 'Allow access to messages' ON කරන්න (මෙය සක්‍රිය නොකළහොත් Meta මගින් පණිවිඩ API එකට ලබා නොදේ).",
          "3. Facebook Page එකට Instagram සම්බන්ධ කිරීම: Meta Business Suite (business.facebook.com) වෙත ගොස් Settings -> Instagram Accounts යටතේ ඔබගේ Facebook Page එකට Instagram ගිණුම සම්බන්ධ (Link) කරන්න.",
          "4. Permissions ලබාදීම: Meta Business Settings හි ඔබගේ Permanent Token එකට pages_messaging, pages_show_list, සහ instagram_manage_messages permissions ලබා දී ඇති බව තහවුරු කරගන්න.",
          "5. Layer 1 (Page-Level Subscription - ස්වයංක්‍රීයයි ✅): WPPX Settings හි 'Instagram & Messenger' වෙත ගොස් 'Connect Page & Instagram' ක්ලික් කළ විට ඔබගේ Facebook Page එක Meta App එකට ස්වයංක්‍රීයව subscribe වේ.",
          "6. Layer 2 (App-Level Webhooks in Meta Developer Portal): developers.facebook.com හි App 1410476257886677 -> Webhooks වෙත ගොස්: (අ) Page object යටතේ 'messages' සහ 'messaging_postbacks' subscribe කරන්න, (ආ) Instagram object යටතේ 'messages' subscribe කරන්න (පහත Callback URL සහ Verify Token භාවිත කරන්න).",
        ],
        hasWebhookFields: true,
        link: "https://business.facebook.com/latest/settings/instagram_accounts",
        linkText: "Meta Business Suite: Instagram Accounts වෙත යන්න",
        secondaryLink: "https://developers.facebook.com/apps/1410476257886677/webhooks/",
        secondaryLinkText: "Meta Developer Webhooks වෙත යන්න",
      },
    ],
    en: [
      {
        step: 1,
        title: "Create a Meta Developer App",
        badge: "Step 1",
        desc: "Set up a Meta Developer App configured for WhatsApp Business Cloud API.",
        instructions: [
          "Go to developers.facebook.com and log in with your Facebook account.",
          "Click 'My Apps' at top-right, then click 'Create App'.",
          "Select 'Other' as the use case, then choose 'Business' type.",
          "Enter your App Name (e.g., WPPX Hub) and select your Business Account.",
          "Find 'WhatsApp' in the product catalogue and click 'Set up'.",
        ],
        link: "https://developers.facebook.com/apps/",
        linkText: "Open Meta Developer Console",
      },
      {
        step: 2,
        title: "Register WhatsApp Phone Number",
        badge: "Step 2",
        desc: "Link your business phone number to the Meta WhatsApp Cloud API.",
        instructions: [
          "In your Meta App left navigation, navigate to 'WhatsApp' -> 'Production setup'.",
          "Click 'Add phone number'.",
          "Set your Business Display Name (e.g. WPPX Store) and category.",
          "Enter your phone number and verify via the 6-digit SMS OTP.",
          "Note: If this number is active on mobile WhatsApp app, you must delete the account from the mobile app first (using a dedicated business SIM is strongly recommended).",
        ],
        link: "https://developers.facebook.com",
        linkText: "Open Meta WhatsApp Setup",
      },
      {
        step: 3,
        title: "Generate Permanent System User Token",
        badge: "Step 3",
        desc: "Create a non-expiring System User Token with messaging permissions.",
        instructions: [
          "Navigate to business.facebook.com/settings and go to 'Users' -> 'System users'.",
          "Click 'Add' to create an Admin System User (e.g., WPPXBotAdmin).",
          "Select the system user, click 'Assign assets' -> 'Apps' -> select your Meta App and toggle 'Manage app' (Full control).",
          "Click 'Generate token' and choose your app.",
          "Set Token Expiration to 'Never'.",
          "Check 'whatsapp_business_messaging' and 'whatsapp_business_management', then click Generate and copy the token.",
        ],
        link: "https://business.facebook.com/settings/system-users",
        linkText: "Open Meta Business Settings",
      },
      {
        step: 4,
        title: "Configure Inbound Webhook",
        badge: "Step 4",
        desc: "Receive real-time customer WhatsApp messages directly in WPPX.",
        instructions: [
          "In Meta Developer Console, go to 'WhatsApp' -> 'Configuration' (or Webhooks).",
          "Copy and paste your unique Callback URL and Verify Token below into Meta's form:",
        ],
        link: "https://developers.facebook.com",
        linkText: "Open Meta Webhooks Config",
        hasWebhookFields: true,
      },
      {
        step: 5,
        title: "Connect & Launch on WPPX",
        badge: "Step 5",
        desc: "Auto-detect and activate your WhatsApp Business number on WPPX Hub.",
        instructions: [
          "Open WPPX Hub and navigate to the 'Meta API' tab -> '1-Click Auto Setup'.",
          "Paste your Permanent Access Token generated in Step 3.",
          "Click 'Auto-Detect My WhatsApp Numbers'.",
          "Click 'Connect This Number'. Webhook subscription will be executed automatically!",
          "All done! Send 'Hi' from any personal phone to your WhatsApp number to test the real-time bot and live inbox.",
        ],
      },
      {
        step: 6,
        title: "Instagram & Messenger Setup",
        badge: "Omnichannel",
        desc: "Connect Facebook Messenger and Instagram Direct Messaging to WPPX.",
        instructions: [
          "1. Switch Instagram to Professional: Open Instagram mobile app -> Settings & privacy -> Account type and tools -> Switch to professional account (or Creator).",
          "2. Enable DM Access on Instagram: In Instagram mobile app -> Settings & privacy -> Messages and story replies -> Message controls -> Toggle 'Allow access to messages' to ON (crucial: Meta blocks API delivery if this is disabled).",
          "3. Link Instagram to Facebook Page: Open Meta Business Suite (business.facebook.com) -> Settings -> Instagram Accounts -> Click 'Add Instagram' and link your Instagram profile to your Facebook Page.",
          "4. Verify System User Permissions: In Meta Business Settings -> System Users -> Tokens, make sure your token includes 'pages_show_list', 'pages_messaging', and 'instagram_manage_messages'.",
          "5. Layer 1 (Page-Level Subscription - Automated ✅): In WPPX Settings -> 'Instagram & Messenger', paste token and click 'Discover Pages', then 'Connect Page & Instagram' — our system automatically subscribes your Facebook Page to our Meta App.",
          "6. Layer 2 (App-Level Webhooks in Meta Developer Portal): In developers.facebook.com -> App 1410476257886677 -> Webhooks: (a) Under 'Page', subscribe to 'messages' and 'messaging_postbacks'. (b) Under 'Instagram', subscribe to 'messages' (using the Callback URL and Verify Token below).",
        ],
        hasWebhookFields: true,
        link: "https://business.facebook.com/latest/settings/instagram_accounts",
        linkText: "Meta Business Suite: Link Instagram Account",
        secondaryLink: "https://developers.facebook.com/apps/1410476257886677/webhooks/",
        secondaryLinkText: "Meta Developer Webhooks",
      },
    ],
  };

  const currentSteps = stepsContent[lang];
  const activeContent = currentSteps[activeStep - 1];

  return (
    <div className="fixed inset-0 z-50 bg-[#0A504A]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in font-secondary">
      <div className="bg-white rounded-3xl shadow-2xl border border-[#dee3e9] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#dee3e9] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#A2E4B8]/30 flex items-center justify-center text-[#00A86B] border border-[#00A86B]/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#0A504A]">
                {lang === "si" ? "Meta API සම්බන්ධ කිරීමේ සම්පූර්ණ උපදෙස් මාලාව" : "Meta Cloud API Setup & Integration Guide"}
              </h2>
              <p className="text-xs text-[#5d6c7b]">
                {lang === "si" ? "පියවර 6 කින් WhatsApp, Messenger සහ Instagram WPPX පද්ධතියට සම්බන්ධ කරගන්න" : "Connect WhatsApp, Messenger & Instagram in 6 easy steps"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="flex items-center p-1 bg-[#F7F7F2] rounded-full border border-[#dee3e9]">
              <button
                onClick={() => setLang("si")}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  lang === "si"
                    ? "bg-[#00A86B] text-white shadow-xs"
                    : "text-[#5d6c7b] hover:text-[#0A504A]"
                }`}
              >
                🇱🇰 සිංහල
              </button>
              <button
                onClick={() => setLang("en")}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  lang === "en"
                    ? "bg-[#00A86B] text-white shadow-xs"
                    : "text-[#5d6c7b] hover:text-[#0A504A]"
                }`}
              >
                🇬🇧 English
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-[#5d6c7b] hover:text-[#0A504A] hover:bg-[#F7F7F2] rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Step Indicator Tabs */}
        <div className="flex items-center border-b border-[#dee3e9] bg-[#F7F7F2]/50 px-6 py-2 overflow-x-auto gap-2 shrink-0">
          {currentSteps.map((s) => (
            <button
              key={s.step}
              onClick={() => setActiveStep(s.step)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeStep === s.step
                  ? "bg-[#00A86B] text-white shadow-xs"
                  : "bg-white text-[#444950] border border-[#dee3e9] hover:bg-white/80"
              }`}
            >
              <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-extrabold ${
                activeStep === s.step ? "bg-white text-[#00A86B]" : "bg-[#F7F7F2] text-[#444950]"
              }`}>
                {s.step}
              </span>
              <span>{s.title}</span>
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#A2E4B8]/30 text-[#0A504A] border border-[#00A86B]/30">
                {activeContent.badge}
              </span>
              <h3 className="text-lg font-bold text-[#0A504A]">
                {activeContent.title}
              </h3>
            </div>
            <p className="text-xs text-[#5d6c7b]">{activeContent.desc}</p>
          </div>

          {/* Instructions List */}
          <div className="bg-[#F7F7F2]/60 border border-[#dee3e9] rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-[#0A504A] uppercase tracking-wider">
              {lang === "si" ? "අනුගමනය කළ යුතු පියවර:" : "Step-by-step instructions:"}
            </h4>
            <ol className="space-y-2.5 text-xs text-[#1c1e21]">
              {activeContent.instructions.map((inst, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-white border border-[#dee3e9] flex items-center justify-center font-bold text-[11px] text-[#00A86B] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{inst}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Webhook Fields if in Step 4 */}
          {activeContent.hasWebhookFields && (
            <div className="bg-white border border-[#00A86B]/40 rounded-2xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#00A86B]" />
                <h4 className="text-xs font-bold text-[#0A504A]">
                  {lang === "si" ? "Meta වෙත ලබාදිය යුතු Webhook අගයන්:" : "Your Webhook Credentials to Paste in Meta:"}
                </h4>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-[#0A504A] block mb-1">
                    Callback URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={webhookUrl}
                      className="meta-input w-full bg-[#F7F7F2] font-mono text-[11px]"
                    />
                    <button
                      onClick={() => handleCopy(webhookUrl, "webhook")}
                      className="px-3 py-1.5 bg-[#0A504A] text-white rounded-lg hover:bg-[#00A86B] transition-colors flex items-center gap-1 font-semibold cursor-pointer shrink-0"
                    >
                      {copiedWebhook ? <Check className="w-3 h-3 text-[#A2E4B8]" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedWebhook ? (lang === "si" ? "පිටපත් විය" : "Copied") : (lang === "si" ? "පිටපත් කරන්න" : "Copy")}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-[#0A504A] block mb-1">
                    Verify Token (Your Unique Token)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={verifyToken}
                      className="meta-input w-full bg-[#F7F7F2] font-mono text-[11px]"
                    />
                    <button
                      onClick={() => handleCopy(verifyToken, "token")}
                      className="px-3 py-1.5 bg-[#0A504A] text-white rounded-lg hover:bg-[#00A86B] transition-colors flex items-center gap-1 font-semibold cursor-pointer shrink-0"
                    >
                      {copiedToken ? <Check className="w-3 h-3 text-[#A2E4B8]" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedToken ? (lang === "si" ? "පිටපත් විය" : "Copied") : (lang === "si" ? "පිටපත් කරන්න" : "Copy")}</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-[#A2E4B8]/30 border border-[#00A86B]/40 rounded-xl text-[11px] text-[#0A504A] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00A86B] shrink-0" />
                  <span>
                    {lang === "si"
                      ? "Verify and save කළ පසු 'messages' කියන event එක Subscribe කිරීමට අමතක නොකරන්න!"
                      : "After clicking 'Verify and save', make sure to Subscribe to the 'messages' event!"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* External Action Links */}
          {(activeContent.link || (activeContent as any).secondaryLink) && (
            <div className="pt-2 flex flex-wrap gap-2.5">
              {activeContent.link && (
                <a
                  href={activeContent.link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F7F7F2] hover:bg-[#A2E4B8]/20 text-[#0A504A] border border-[#dee3e9] hover:border-[#00A86B] rounded-full text-xs font-bold transition-colors"
                >
                  <span>{activeContent.linkText}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#00A86B]" />
                </a>
              )}
              {(activeContent as any).secondaryLink && (
                <a
                  href={(activeContent as any).secondaryLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-[#0064E0] border border-[#dee3e9] hover:border-[#0064E0] rounded-full text-xs font-bold transition-colors"
                >
                  <span>{(activeContent as any).secondaryLinkText}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#0064E0]" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 border-t border-[#dee3e9] bg-[#F7F7F2]/40 flex items-center justify-between shrink-0">
          <button
            onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
            disabled={activeStep === 1}
            className="px-4 py-2 text-xs font-bold text-[#444950] hover:text-[#0A504A] disabled:opacity-30 cursor-pointer"
          >
            {lang === "si" ? "← කලින් පියවර" : "← Previous Step"}
          </button>

          <span className="text-xs font-bold text-[#0A504A]">
            {activeStep} / {currentSteps.length}
          </span>

          {activeStep < currentSteps.length ? (
            <button
              onClick={() => setActiveStep((prev) => Math.min(currentSteps.length, prev + 1))}
              className="px-5 py-2 bg-[#00A86B] text-white rounded-full text-xs font-bold hover:bg-[#0A504A] transition-colors cursor-pointer"
            >
              {lang === "si" ? "ඊළඟ පියවර →" : "Next Step →"}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-5 py-2 bg-[#00A86B] text-white rounded-full text-xs font-bold hover:bg-[#0A504A] transition-colors cursor-pointer"
            >
              {lang === "si" ? "සම්පූර්ණයි ✓" : "Done ✓"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
