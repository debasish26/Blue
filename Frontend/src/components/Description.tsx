import React from "react";

export function Description() {
    return (
        <div className="container mx-auto px-4 py-12 text-blue-100">
            <div className="bg-slate-800/40 rounded-3xl p-8 backdrop-blur-lg border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                <h2 className="text-3xl font-bold text-blue-300 mb-6 text-center">
                    Why BLUE is Impactful
                </h2>
                <ul className="space-y-4 text-lg">
                    <li className="flex items-start gap-2">
                        ✅ <span>Stay Safe with Real-Time Weather Alerts 🌍⚡

                            Disasters don’t wait. Neither should you. Our AI-powered Weather Alert System provides instant, accurate, and life-saving notifications for extreme weather events. Whether it’s a hurricane, flood, earthquake, or heatwave, our system ensures you get real-time alerts via SMS, WhatsApp, and Email—so you can act before it’s too late.
                        </span>
                    </li>
                    <li className="flex items-start gap-2">
                        ✅ <span>Instant Notifications – Get real-time disaster alerts based on trusted weather data.</span>
                    </li>
                    <li className="flex items-start gap-2">
                        ✅ <span>AI-Powered Predictions – Our smart system analyzes weather patterns for early warnings.</span>
                    </li>
                    <li className="flex items-start gap-2">
                        ✅ <span> Location-Based Alerts – Receive warnings only when it affects your area—no spam!</span>
                    </li>
                    <li className="flex items-start gap-2">
                        ✅ <span> Multi-Channel Updates – Stay informed via SMS, WhatsApp, and Email anytime, anywhere.</span>
                    </li>
                    <li className="flex items-start gap-2">
                        ✅ <span> Privacy First – Your data is secure and encrypted, used only for sending alerts.</span>
                    </li>
                    <li className="flex items-start gap-2">
                        ✅ <span>  Global Reach – Whether you’re in a city or a remote village, our system keeps you informed</span>
                    </li>


                </ul>

            </div>

            <div className="mt-12 bg-slate-800/40 rounded-3xl p-8 backdrop-blur-lg border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                <h2 className="text-3xl font-bold text-blue-300 mb-6 text-center">
                    Interactive Disaster Map
                </h2>
                <p className="text-lg text-blue-200 text-center">
                    An interactive map displays real-time disaster reports, weather alerts, and affected areas.
                </p>
            </div>
        </div>
    );
}

export default Description;
