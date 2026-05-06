import type { Metadata } from "next";

export const metadata: Metadata = {
 title: "Community Standards — Jungle",
 description: "Our community standards and content policies.",
};

export default function CommunityStandardsPage() {
 return (
 <div className="max-w-3xl mx-auto py-12 px-4 prose dark:prose-invert">
 <h1>Community Standards</h1>
 <p>Last updated: April 2026</p>

 <h2>1. Our Commitment</h2>
 <p>
 Jungle is a place for authentic connection. We are committed to keeping our platform safe,
 respectful, and welcoming for everyone. These Community Standards outline what is and isn&apos;t
 allowed on Jungle.
 </p>

 <h2>2. Safety</h2>
 <h3>2.1 Violence and Criminal Behavior</h3>
 <p>Content that promotes, glorifies, or threatens violence is not allowed.</p>
 <h3>2.2 Harassment and Bullying</h3>
 <p>Targeted harassment, bullying, or coordinated abuse is prohibited.</p>
 <h3>2.3 Hate Speech</h3>
 <p>Content attacking people based on protected characteristics (race, ethnicity, religion, gender, sexual orientation, disability) is not allowed.</p>

 <h2>3. Authenticity</h2>
 <h3>3.1 Fake Accounts</h3>
 <p>Impersonating others or creating fake accounts is prohibited.</p>
 <h3>3.2 Spam and Misinformation</h3>
 <p>Coordinated spam, scams, and verifiably false information intended to cause harm are not allowed.</p>

 <h2>4. Privacy</h2>
 <h3>4.1 Personal Information</h3>
 <p>Sharing others&apos; private personal information without consent (doxing) is prohibited.</p>
 <h3>4.2 Intimate Content</h3>
 <p>Non-consensual sharing of intimate images is strictly prohibited and will be reported to authorities.</p>

 <h2>5. Intellectual Property</h2>
 <p>Respect copyrights and trademarks. Only share content you own or have permission to share.</p>

 <h2>6. Enforcement</h2>
 <p>Violations may result in content removal, account restrictions, suspension, or permanent ban. Users can appeal moderation decisions through the Support Inbox.</p>

 <h2>7. Reporting</h2>
 <p>If you see content that violates these standards, please use the Report function available on every post, comment, and profile.</p>
 </div>
 );
}
