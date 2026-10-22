#!/usr/bin/env python3
"""Builds the SA guide and the Admin guide as HTML (then rendered to PDF with Chromium)."""
import pathlib
OUT = pathlib.Path(__file__).parent

CSS = """
@page { size: 8.5in 14in; margin: 1in; }
* { box-sizing: border-box; }
body { font-family: Arial, Helvetica, sans-serif; color: #333333; font-size: 14pt; line-height: 1.45; margin: 0; }
.cover { height: 11.6in; display: flex; flex-direction: column; justify-content: center; page-break-after: always; }
.badge { display: inline-block; background: #c8102e; color: #fff; font-weight: bold; font-size: 18pt; padding: 6px 16px; border-radius: 6px; margin-bottom: 28px; }
h1.title { font-size: 26pt; color: #1b3a5c; margin: 0 0 14px; line-height: 1.2; }
.sub { font-size: 17pt; color: #2e75b6; margin: 0 0 6px; }
.region { font-size: 17pt; color: #666666; margin: 0 0 40px; }
table.meta { border-collapse: collapse; width: 100%; font-size: 13pt; }
table.meta td { border: 1px solid #000; padding: 8px 10px; }
table.meta tr:nth-child(odd) td { background: #f5f5f5; }
table.meta td.k { font-weight: bold; color: #1b3a5c; width: 30%; }
h2 { font-size: 14pt; color: #2e75b6; margin: 26px 0 8px; page-break-after: avoid; }
h3 { font-size: 14pt; color: #333333; margin: 18px 0 6px; page-break-after: avoid; }
h2.problem { color: #c8102e; }
p { margin: 0 0 10px; text-align: justify; }
ul, ol { margin: 0 0 10px 0; padding-left: 26px; }
li { margin-bottom: 4px; }
table.data { border-collapse: collapse; width: 100%; margin: 8px 0 14px; page-break-inside: auto; }
table.data th { background: #1b3a5c; color: #fff; font-weight: bold; padding: 8px 10px; border: 1px solid #cccccc; text-align: left; vertical-align: middle; }
table.data td { background: #f5f5f5; padding: 8px 10px; border: 1px solid #cccccc; vertical-align: middle; }
table.data td.k { font-weight: bold; color: #2e75b6; }
table.data tr { page-break-inside: avoid; }
.callout { background: #fff4e5; border-left: 6px solid #c8102e; padding: 10px 14px; margin: 12px 0 16px; }
.tip { background: #eef5fb; border-left: 6px solid #2e75b6; padding: 10px 14px; margin: 12px 0 16px; }
.small { font-size: 12pt; color: #666666; }
.band-Gold { color: #a67c00; font-weight: bold; } .band-Green { color: #1f8a4c; font-weight: bold; }
.band-Amber { color: #b36b00; font-weight: bold; } .band-Red { color: #c62828; font-weight: bold; } .band-Review { color: #666; font-weight: bold; }
.pb { page-break-before: always; }
.footer { margin-top: 30px; font-size: 11pt; color: #666; border-top: 1px solid #ccc; padding-top: 8px; }
"""

def page(title, body):
    return f"<!doctype html><html><head><meta charset='utf-8'><title>{title}</title><style>{CSS}</style></head><body>{body}</body></html>"

def cover(badge, title, sub, meta):
    rows = "".join(f"<tr><td class='k'>{k}</td><td>{v}</td></tr>" for k, v in meta)
    return f"""<div class='cover'><span class='badge' style='align-self:flex-start'>{badge}</span>
<h1 class='title'>{title}</h1><p class='sub'>{sub}</p><p class='region'>BNI TNT Region · Tirunelveli, Nagercoil, Tuticorin, Tenkasi, Marthandam</p>
<table class='meta'>{rows}</table></div>"""

SCORING_TABLE = """
<table class='data'>
<tr><th>#</th><th>KPI</th><th>Where the number comes from</th><th>Scoring</th><th>Max</th></tr>
<tr><td>1</td><td class='k'>Your own Member Score</td><td>Your Traffic Light score as a member (admin enters monthly)</td><td>80 or more = 10 pts<br>70 to 79 = 5 pts<br>Below 70 = 0</td><td>10</td></tr>
<tr><td>2</td><td class='k'>Training Attendance</td><td>BNI Connect Member Training Report: unique members of your chapter who attended any training in the month, divided by chapter member count (Online + Offline combined)</td><td>20% or more = 20 pts<br>15% to 19.9% = 15 pts<br>10% to 14.9% = 10 pts<br>Below 10% = 0</td><td>20</td></tr>
<tr><td>3</td><td class='k'>1st-Year Retention</td><td>Chapter's first-year retention % (admin enters from the 3+1 Traffic Lights report)</td><td>75% or more = 25 pts<br>70% to 74.9% = 15 pts<br>Below 70% = 0</td><td>25</td></tr>
<tr><td>4</td><td class='k'>1-2-1 Activity</td><td>BNI Connect Chapter Statistics: "1-2-1 Per Member" for the month</td><td>8.66 or more per member per month (= 2 per week) = 10 pts<br>Below = 0</td><td>10</td></tr>
<tr><td>5</td><td class='k'>LTRT / DCRT Attendance</td><td>Admin marks attendance</td><td>Attended = 5 pts<br>Not attended = 0</td><td>5</td></tr>
<tr><td>6</td><td class='k'>Chapter Visit Report (Jotform)</td><td>Your monthly submission on the BNI Chapter Visit Report form, matched to your name automatically</td><td>Submitted = 10 pts<br>Not submitted = 0</td><td>10</td></tr>
<tr><td>7</td><td class='k'>Mentoring Completion</td><td>Paused until the mentoring app is live</td><td>Not scored for now</td><td>(20)</td></tr>
</table>
<p><b>Total: 80 raw points, scaled to 100.</b> Your score on the dashboard = raw points ÷ 80 × 100. Example: 60 raw points shows as 75.</p>
"""

BANDS_TABLE = """
<table class='data'>
<tr><th>Score (out of 100)</th><th>Band</th><th>Meaning</th><th>Commission multiplier</th></tr>
<tr><td>85 to 100</td><td class='band-Gold'>🏆 Gold</td><td>Exceptional</td><td>1.00× (full commission)</td></tr>
<tr><td>70 to 84.9</td><td class='band-Green'>✅ Green</td><td>On Track</td><td>0.80×</td></tr>
<tr><td>55 to 69.9</td><td class='band-Amber'>🟡 Amber</td><td>Needs Improvement: coaching conversation</td><td>0.60×</td></tr>
<tr><td>40 to 54.9</td><td class='band-Red'>🔴 Red</td><td>Underperforming: formal review</td><td>0.35×</td></tr>
<tr><td>Below 40</td><td class='band-Review'>⚠️ Review</td><td>At Risk: improvement plan</td><td>0.15×</td></tr>
</table>
"""

PAYOUT = """
<p>Your monthly payout has two parts: how many members paid in your chapter that month, and which band you landed in.</p>
<table class='data'>
<tr><th>Step</th><th>Calculation</th></tr>
<tr><td class='k'>1. Members paid</td><td>New member inductions + renewals <b>paid in that month</b> (a renewal due 1 Nov but paid on 15 Oct counts in October)</td></tr>
<tr><td class='k'>2. Base commission</td><td>Members paid × 2.5% of ₹49,040 = Members paid × ₹1,226</td></tr>
<tr><td class='k'>3. Band multiplier</td><td>Base commission × your band multiplier (1.00 / 0.80 / 0.60 / 0.35 / 0.15)</td></tr>
</table>
<p><b>Example:</b> 1 new member + 3 renewals paid in October = 4 members × ₹1,226 = ₹4,904 base. Score 75 (Green, 0.80×) pays ₹3,923. The same month at Gold would pay ₹4,904. At Red it pays ₹1,716. The band costs you real money.</p>
<p class='small'>The fee and percentage are set by the regional office and may be revised. The dashboard always shows the current figures.</p>
"""


SDC_SCORING_TABLE = """
<table class='data'>
<tr><th>#</th><th>KPI</th><th>Where the number comes from</th><th>Scoring</th><th>Max</th></tr>
<tr><td>1</td><td class='k'>Chapter Net Growth</td><td>This month's member count minus last month's (BNI Connect Chapter Statistics "Mem Avg"). Admin can override with the exact joiners-minus-leavers figure.</td><td>+2 or more = 20 pts<br>+1 = 10 pts<br>0 or negative = 0</td><td>20</td></tr>
<tr><td>2</td><td class='k'>All India Traffic Light</td><td>Your chapter's colour on the monthly All India Chapter Traffic Lights report (uploaded by admin)</td><td>GREEN = 15 pts<br>AMBER or RED = 0</td><td>15</td></tr>
<tr><td>3</td><td class='k'>Overall Renewal Rate</td><td>Chapter's overall retention % as published in the monthly 3+1 Traffic Lights (admin enters)</td><td>80% or more = 20 pts<br>70% to 79.9% = 10 pts<br>Below 70% = 0</td><td>20</td></tr>
<tr><td>4</td><td class='k'>Your own Member Score</td><td>Your Traffic Light score as a member (admin enters)</td><td>80 or more = 10 pts<br>70 to 79 = 5 pts<br>Below 70 = 0</td><td>10</td></tr>
<tr><td>5</td><td class='k'>Weekly Tele-Bridge call with LT</td><td>Your weekly "Support DC Tele-bridge Call" Jotform submissions, matched to each chapter meeting date automatically</td><td>Weeks done ÷ meetings held × 10</td><td>10</td></tr>
<tr><td>6</td><td class='k'>PALMS submitted on time</td><td>Admin ticks each meeting week on Friday evening</td><td>Weeks on time ÷ meetings held × 10</td><td>10</td></tr>
<tr><td>7</td><td class='k'>Chapter Visit within 24 hours</td><td>Your BNI Chapter Visit Report on Jotform, matched to your name; counts only if submitted on the visit day or the next day</td><td>Done = 10 pts<br>Not done or late = 0</td><td>10</td></tr>
<tr><td>8</td><td class='k'>LTRT / DCRT attendance</td><td>Admin marks attendance</td><td>Attended = 5 pts<br>Not attended = 0</td><td>5</td></tr>
</table>
<p><b>Total: 100 points.</b> "Meetings held" is the number of your chapter's meeting weekdays in the month (a Tuesday chapter has 4 or 5), minus any week the office marks as "no meeting" (holiday). A Tuesday chapter with 5 meetings and 4 calls done scores 4 ÷ 5 × 10 = 8.0.</p>
"""

SDC_PAYOUT = """
<p>Your monthly payout has two parts: how many members paid in your chapter that month, and which band you landed in.</p>
<table class='data'>
<tr><th>Step</th><th>Calculation</th></tr>
<tr><td class='k'>1. Members paid</td><td>New member inductions + renewals <b>paid in that month</b> in your chapter (the same count the office enters for the SA programme)</td></tr>
<tr><td class='k'>2. Base commission</td><td>Members paid × 7.5% of ₹49,040 = Members paid × ₹3,678</td></tr>
<tr><td class='k'>3. Band multiplier</td><td>Base commission × your band multiplier (1.00 / 0.80 / 0.60 / 0.35 / 0.15)</td></tr>
</table>
<p><b>Example:</b> 1 new member + 3 renewals paid in October = 4 members × ₹3,678 = ₹14,712 base. Score 75 (Green, 0.80×) pays ₹11,770. The same month at Gold pays ₹14,712. At Red it pays ₹5,149.</p>
<p class='small'>The fee and percentage are set by the regional office and may be revised. The dashboard always shows the current figures.</p>
"""

# ------------------------------------------------------------------ SA GUIDE
sa_body = cover("SA GUIDE", "Support Ambassador Scorecard<br>How it works and how to score high",
    "User guide for Support Ambassadors", [
    ("Version", "1.0"), ("Date", "21 October 2026"), ("Applies to", "All BNI TNT Support Ambassadors"),
    ("Website", "https://sa.bnitnt.in"), ("Prepared by", "Mohamed Riaz, Executive Director, BNI TNT")])

sa_body += """
<h2>1. What this is</h2>
<p>The SA Scorecard is your personal performance page. Every month the regional office publishes your score across six KPIs, your band, your rank among the 14 Support Ambassadors, the region average, and the commission you earned. It replaces the old Google Sheet. Nothing is hidden: every point is explained on the page, and every point tells you what to do next month.</p>
<div class='callout'><b>Why it exists.</b> An SA is a member first and a chapter's support system second. The scorecard rewards exactly the things that make a chapter healthy: members trained, members retained, 1-2-1s happening, and you showing up. Score high and the chapter grows. There is no trick to it.</div>

<h2>2. Logging in</h2>
<ol>
<li>Open <b>https://sa.bnitnt.in</b> on your phone or laptop. Save it to your home screen.</li>
<li>On the <b>Support Ambassador</b> tab, pick your chapter and enter your PIN.</li>
<li>Forgot your PIN? Message the BNI TNT office. They reset it in seconds. Never share your PIN.</li>
</ol>
<p>If you support two chapters, you have two logins, one per chapter. Each chapter has its own scorecard and its own rank.</p>

<h2>3. Reading your scorecard</h2>
<table class='data'>
<tr><th>Section</th><th>What it shows</th></tr>
<tr><td class='k'>Month selector</td><td>Top right. Switch between published months. The latest month opens by default.</td></tr>
<tr><td class='k'>Score ring</td><td>Your score out of 100, your band, your rank (#1 to #14), the region average, and raw points (for example 60/80).</td></tr>
<tr><td class='k'>Payout</td><td>Your commission for the month with the full working: members paid × ₹1,226 × band multiplier.</td></tr>
<tr><td class='k'>KPI breakdown</td><td>Each KPI with your actual value and the points earned out of the maximum. Red zero means you left points on the table.</td></tr>
<tr><td class='k'>How to reach the next band</td><td>The exact actions, biggest gain first, that take you to the next band. Start here every month.</td></tr>
<tr><td class='k'>Your trend</td><td>Your score month by month against the region average and the Gold line at 85.</td></tr>
</table>
<p><b>Fresh start:</b> every SA starts from October 2026. Nothing from the old Google Sheet is carried over, so your first scorecard, rank and payout are for October.</p>

<h2 class='pb'>4. The scoring system</h2>
""" + SCORING_TABLE + """
<h3>Bands and commission</h3>
""" + BANDS_TABLE + """
<h2>5. Your payout</h2>
""" + PAYOUT + """

<h2 class='pb'>6. How to score high: the playbook</h2>
<p>Work the KPIs in this order. The first three are entirely in your hands and together are worth 25 raw points, the difference between Red and Gold.</p>

<h3>6.1 Chapter Visit Report on Jotform: 10 points, 10 minutes</h3>
<ul>
<li>Submit the BNI Chapter Visit Report form once every month, before the last day of the month. The system picks it up automatically.</li>
<li>Write your name on the form exactly as the office has it on record ("Visited By" / "Name"). A different spelling does not match and you lose the 10 points.</li>
<li>In September 2026, 9 of 14 SAs missed this. It was the single cheapest 10 points in the region.</li>
</ul>

<h3>6.2 LTRT / DCRT attendance: 5 points</h3>
<ul><li>Be in the room. If you cannot attend, inform the office before the meeting. Not attending is 0, and it is noticed.</li></ul>

<h3>6.3 Your own Member Score: 10 points</h3>
<ul>
<li>Your own Traffic Light score must be 80 or more. You cannot ask members to do what you don't do.</li>
<li>Attendance, referrals given, visitors invited, 1-2-1s, CEUs, TYFCB: the same six things you coach members on.</li>
</ul>

<h3>6.4 1-2-1 Activity: 10 points, needs 8.66 per member per month</h3>
<ul>
<li>This is 2 per member per week. In September only one chapter in the region cleared it. It is hard, and it is the most important number in BNI.</li>
<li>Run a 1-2-1 challenge with the Membership Committee: weekly leaderboard in the chapter group, recognition at the meeting.</li>
<li>Pair every new member with 4 scheduled 1-2-1s in their first month. New members pull the chapter average up fast.</li>
<li>Make sure members <b>record</b> their 1-2-1s in BNI Connect. Unrecorded 1-2-1s do not exist for scoring.</li>
</ul>

<h3>6.5 Training Attendance: 20 points, needs 20% of members</h3>
<ul>
<li>Counted as unique members who attended any BNI training in the month, divided by chapter size. A 50-member chapter needs 10 different members in training that month.</li>
<li>Book MSP for every new member in their induction month. That alone is 2 to 4 members.</li>
<li>Push one workshop per month (Feature Presentation, Referral Skills, Power Team) and get the Education Coordinator to announce it twice.</li>
<li>Online trainings count the same as offline. They are the easiest way to reach 20%.</li>
</ul>

<h3>6.6 1st-Year Retention: 25 points, the biggest prize</h3>
<ul>
<li>Members who leave in year one are members nobody looked after. Your job is to know every first-year member by name and by renewal date.</li>
<li>90 days before renewal: a 1-2-1 with you. 60 days: check their referral and TYFCB numbers with them. 30 days: renewal conversation with the Membership Committee.</li>
<li>At 75% you get the full 25 points. At 69% you get nothing. The gap between those two is usually one or two members.</li>
</ul>

<div class='tip'><b>A realistic Gold month.</b> Member score 80+ (10) + 20% trained (20) + retention 75%+ (25) + LTRT (5) + Jotform (10) = 70 raw = 87.5 on the dashboard = Gold, even with the 1-2-1 target missed. Gold is reachable without a perfect month.</div>

<h2>7. The monthly cycle</h2>
<table class='data'>
<tr><th>When</th><th>What happens</th></tr>
<tr><td class='k'>During the month</td><td>You work the chapter. Submit the Jotform visit report. Record 1-2-1s. Push training.</td></tr>
<tr><td class='k'>1st week of next month</td><td>Office pulls BNI Connect reports, enters the manual inputs, checks and publishes the month.</td></tr>
<tr><td class='k'>After publishing</td><td>Your scorecard updates. Read "How to reach the next band" and plan the month.</td></tr>
<tr><td class='k'>Payout</td><td>Monthly, on the published score.</td></tr>
</table>

<h2>8. Questions</h2>
<table class='data'>
<tr><th>Question</th><th>Answer</th></tr>
<tr><td class='k'>A number looks wrong</td><td>Message the office with the month and KPI. Uploads can be checked and a month can be corrected and re-published.</td></tr>
<tr><td class='k'>I changed chapters</td><td>Your history stays with you. If you were newly appointed, your scorecard starts from your first month.</td></tr>
<tr><td class='k'>Can I see other SAs' scores?</td><td>No. You see your rank and the region average only.</td></tr>
<tr><td class='k'>Why is Mentoring not scored?</td><td>It is paused until the mentoring app is live. The score is out of 80 and scaled to 100 so bands stay the same.</td></tr>
</table>
<div class='footer'>BNI TNT Region · SA Scorecard Guide v1.0 · Prepared by Mohamed Riaz · https://sa.bnitnt.in</div>
"""


# ------------------------------------------------------------------ SDC GUIDE
sdc_body = cover("SDC GUIDE", "Support DC Scorecard<br>How it works and how to score high",
    "User guide for Support Director Consultants", [
    ("Version", "1.0"), ("Date", "21 October 2026"), ("Applies to", "All BNI TNT Support Director Consultants"),
    ("Website", "https://sa.bnitnt.in (Support DC tab)"), ("Prepared by", "Mohamed Riaz, Executive Director, BNI TNT")])

sdc_body += """
<h2>1. What this is</h2>
<p>The SDC Scorecard is your personal performance page. Every month the regional office publishes your score across eight KPIs, your band, your rank among the 14 Support DCs, the region average, and the commission you earned. It replaces the SDC Google Sheet. Every point is explained on the page, and every point tells you what to do next month.</p>
<div class='callout'><b>Why it exists.</b> A Support DC owns the health of a chapter: is it growing, is it GREEN, are members renewing, is the Leadership Team being coached every week. The scorecard rewards exactly those things. Nothing on it is outside your influence.</div>

<h2>2. Logging in</h2>
<ol>
<li>Open <b>https://sa.bnitnt.in</b> on your phone or laptop. Save it to your home screen.</li>
<li>Tap the <b>Support DC</b> tab, pick your chapter and enter your PIN.</li>
<li>Forgot your PIN? Message the BNI TNT office. They reset it in seconds. Never share your PIN.</li>
</ol>
<p>If you support two chapters, you have two logins, one per chapter. Each chapter has its own scorecard and its own rank.</p>

<h2>3. Reading your scorecard</h2>
<table class='data'>
<tr><th>Section</th><th>What it shows</th></tr>
<tr><td class='k'>Month selector</td><td>Top right. Switch between published months. The latest month opens by default.</td></tr>
<tr><td class='k'>Score ring</td><td>Your score out of 100, your band, your rank (#1 to #14), the region average and raw points.</td></tr>
<tr><td class='k'>Payout</td><td>Your commission for the month with the full working: members paid × ₹3,678 × band multiplier.</td></tr>
<tr><td class='k'>KPI breakdown</td><td>Each KPI with your actual value and the points earned out of the maximum. The two weekly KPIs show every meeting date with a tick or a cross, so you can see exactly which week was missed.</td></tr>
<tr><td class='k'>How to reach the next band</td><td>The exact actions, biggest gain first, that take you to the next band. Start here every month.</td></tr>
<tr><td class='k'>Your trend</td><td>Your score month by month against the region average and the Gold line at 85.</td></tr>
</table>
<p><b>Fresh start:</b> every SDC starts from October 2026. Nothing from the old Google Sheet is carried over, so your first scorecard, rank and payout are for October.</p>

<h2 class='pb'>4. The scoring system</h2>
""" + SDC_SCORING_TABLE + """
<h3>Bands and commission</h3>
""" + BANDS_TABLE + """
<h2>5. Your payout</h2>
""" + SDC_PAYOUT + """

<h2 class='pb'>6. How to score high: the playbook</h2>
<p>Work the KPIs in this order. The first four are entirely in your hands and together are worth 35 points, the difference between Red and Gold.</p>

<h3>6.1 Tele-Bridge call every week: 10 points</h3>
<ul>
<li>After every chapter meeting, hold the tele-bridge call with the Leadership Team and submit the <b>Support DC Tele-bridge Call</b> form the same day. Pick the right chapter and the right <b>meeting date</b> on the form: the app matches your submission to that meeting week.</li>
<li>Two submissions for the same week count once. A missed week cannot be made up later.</li>
<li>If the chapter did not meet (holiday), tell the office so the week is marked "no meeting" and does not count against you.</li>
</ul>

<h3>6.2 PALMS on time every week: 10 points</h3>
<ul><li>Chase the Secretary/Treasurer until PALMS is in on time. The office ticks each week on Friday evening. Late is the same as missing.</li></ul>

<h3>6.3 Chapter Visit Report within 24 hours: 10 points</h3>
<ul>
<li>Visit the chapter at least once in the month and submit the BNI Chapter Visit Report <b>on the day of the visit or the next day</b>. Later than that scores 0, even if the visit happened.</li>
<li>Write your name on the form exactly as the office has it on record ("Visited By"). A different spelling does not match.</li>
</ul>

<h3>6.4 LTRT / DCRT attendance: 5 points</h3>
<ul><li>Be in the room. If you cannot attend, inform the office before the meeting.</li></ul>

<h3>6.5 Your own Member Score: 10 points</h3>
<ul><li>Your own Traffic Light score must be 80 or more. You cannot ask a chapter to go GREEN while you are AMBER.</li></ul>

<h3>6.6 Chapter GREEN on All India Traffic Lights: 15 points</h3>
<ul>
<li>GREEN is 70+ on the BNI Traffic Lights. The six components are the same for every chapter: size, growth, retention, referrals per member, visitors, attendance.</li>
<li>Read your chapter's Path to Green report every month and work the weakest component with the Leadership Team.</li>
</ul>

<h3>6.7 Chapter Net Growth: 20 points</h3>
<ul>
<li>+2 members in a month is the full 20. +1 is 10. Flat or negative is 0, however many visitors came.</li>
<li>Growth is inductions minus drops. Work both ends: a visitor pipeline with the Visitor Host team, and a renewal conversation 90 days out with every member due.</li>
</ul>

<h3>6.8 Overall Renewal Rate 80%+: 20 points</h3>
<ul>
<li>This is the chapter's overall retention figure on the 3+1 Traffic Lights, a rolling number. It moves slowly, so every renewal saved this month keeps paying for a year.</li>
<li>Know every member's renewal date. 90 days before: a 1-2-1 with you. 60 days: check their numbers with them. 30 days: renewal conversation with the Membership Committee.</li>
</ul>

<div class='tip'><b>A realistic Gold month.</b> Tele-Bridge every week (10) + PALMS every week (10) + visit report within 24 h (10) + LTRT (5) + member score 80+ (10) + chapter GREEN (15) + net +2 (20) = 80 = Green. Add renewal rate 70%+ (10) and you are at 90, Gold. The weekly disciplines alone are 35 points.</div>

<h2>7. The monthly cycle</h2>
<table class='data'>
<tr><th>When</th><th>What happens</th></tr>
<tr><td class='k'>Every meeting week</td><td>Tele-bridge call and form. PALMS chased. The office ticks the week on Friday.</td></tr>
<tr><td class='k'>During the month</td><td>Chapter visit and report within 24 hours. LTRT / DCRT.</td></tr>
<tr><td class='k'>1st week of next month</td><td>Office uploads BNI Connect and Traffic Lights reports, enters renewal rate and member scores, checks and publishes the month.</td></tr>
<tr><td class='k'>After publishing</td><td>Your scorecard updates. Read "How to reach the next band" and plan the month.</td></tr>
<tr><td class='k'>Payout</td><td>Monthly, on the published score.</td></tr>
</table>

<h2>8. Questions</h2>
<table class='data'>
<tr><th>Question</th><th>Answer</th></tr>
<tr><td class='k'>A week shows a cross but I did the call</td><td>Check the Tele-bridge form: was the chapter and meeting date right? Message the office with the submission date; they can tick it by hand.</td></tr>
<tr><td class='k'>A number looks wrong</td><td>Message the office with the month and KPI. A month can be corrected and re-published.</td></tr>
<tr><td class='k'>I changed chapters</td><td>Your history stays with you. If you were newly appointed, your scorecard starts from your first month.</td></tr>
<tr><td class='k'>Can I see other SDCs' scores?</td><td>No. You see your rank and the region average only.</td></tr>
</table>
<div class='footer'>BNI TNT Region · SDC Scorecard Guide v1.0 · Prepared by Mohamed Riaz · https://sa.bnitnt.in</div>
"""

# ------------------------------------------------------------------ ADMIN GUIDE
admin_body = cover("ADMIN GUIDE", "SA &amp; SDC Scorecard<br>Monthly operating procedure for admins",
    "Admin manual: data entry, uploads, publishing, user management, for both programmes", [
    ("Version", "1.1"), ("Date", "21 October 2026"), ("Applies to", "BNI TNT admin team (3 admins + ED)"),
    ("Website", "https://sa.bnitnt.in (Admin tab)"), ("Owner", "Mohamed Riaz, Executive Director, BNI TNT")])

admin_body += """
<h2>1. Purpose and roles</h2>
<p>The SA Scorecard app replaces the monthly Google Sheet. Admins enter each month's data, the app computes scores, bands, ranks and payouts, and SAs see only their own results after the month is published. This guide is the complete monthly procedure.</p>
<table class='data'>
<tr><th>Role</th><th>Can do</th></tr>
<tr><td class='k'>Admin</td><td>Open months, upload BNI Connect exports, enter manual inputs, sync Jotform, publish/unpublish, manage users and settings, see all 14 scores.</td></tr>
<tr><td class='k'>SA</td><td>See own scorecard, rank and region average for published months only.</td></tr>
<tr><td class='k'>SDC</td><td>Same, on the Support DC tab. Scored on the SDC KPIs (section 9).</td></tr>
</table>
<p>The admin console has an <b>SA | SDC</b> switch at the top right. Everything on the Months page belongs to the programme selected there; each month is opened and published separately per programme. Sections 3 to 8 describe the SA month; section 9 describes the SDC month.</p>
<div class='callout'><b>Golden rules.</b> (1) Never publish before every chapter has a Member Score, Retention %, LTRT and Jotform status. (2) Upload Chapter Statistics <u>before</u> the Training Report (training % needs the member count). (3) Published months are frozen; unpublish, fix, publish again.</div>

<h2>2. Logging in</h2>
<ol>
<li>Open <b>https://sa.bnitnt.in</b>, click the <b>Admin</b> tab, sign in with your email and password.</li>
<li>Change your password on first login: Users → your name → <b>Set password</b>.</li>
<li>Three menus: <b>Months</b> (monthly work), <b>Settings</b> (commission, thresholds, online event list), <b>Users</b> (SAs, PINs, admins).</li>
</ol>

<h2 class='pb'>3. Monthly procedure (first week of each month, for the previous month)</h2>
<h3>Step 1: Export four files from BNI Connect</h3>
<table class='data'>
<tr><th>Report</th><th>BNI Connect path and parameters</th><th>Files</th></tr>
<tr><td class='k'>Chapter Statistics</td><td>Reports → Region Meeting Statistics → <b>Chapter Statistics</b>. Region: Tirunelveli, then Nagercoil &amp; Tuticorin. <b>From = To = the month</b> (e.g. 10/2026). Export to Excel.</td><td>2 (one per region)</td></tr>
<tr><td class='k'>Member Training Report</td><td>Reports → <b>Region Member Training Report</b>. Region: both, one at a time. All events selected. From = 1st of the month, To = last day of the month. Show: <b>Members who have attended</b>. Export to Excel.</td><td>2 (one per region)</td></tr>
</table>
<p class='small'>The files download as .xls. Upload them exactly as downloaded; do not open and re-save in Excel. A file covering more than one month is rejected.</p>

<h3>Step 2: Upload</h3>
<ol>
<li><b>Months</b> → drop all four files on the upload box (or click it and select). The app reads the month and the region from each file and opens that month automatically.</li>
<li>Order matters: Chapter Statistics first, then Training. If you drop all four together, the app handles them in sequence; if a training file shows "no member count yet", re-upload that training file after the Chapter Statistics.</li>
<li>Check the upload log: "8 chapters updated" (Tirunelveli) and "6 chapters updated" (Nagercoil &amp; Tuticorin). A chapter listed as "not found" means its name in BNI Connect changed; tell the ED.</li>
</ol>
<p>What the uploads fill in: <b>Members</b> (Mem Avg), <b>1-2-1 per member</b>, <b>Online %</b> and <b>Offline %</b> (unique members trained ÷ members; the split follows the online event list in Settings).</p>

<h3>Step 3: Sync Jotform</h3>
<ol>
<li>Click <b>Sync Jotform</b>. The app pulls that month's "BNI Chapter Visit Report" submissions and ticks every chapter where the submitter's name matches the SA's <i>Jotform name</i> (Users page).</li>
<li>Read the result list. "Submitted by X, no match for Y" means the SA wrote their name differently: either fix the Jotform name in Users and sync again, or set the Jotform cell to Done by hand. Manual changes are kept on later syncs.</li>
</ol>

<h3>Step 4: Enter the manual inputs (per chapter)</h3>
<table class='data'>
<tr><th>Column</th><th>Source</th><th>Rule</th></tr>
<tr><td class='k'>Member score</td><td>Monthly Member Traffic Light report</td><td>The SA's own score as a member (0 to 100).</td></tr>
<tr><td class='k'>Retention %</td><td>3+1 Traffic Lights report</td><td>Chapter 1st-year retention for the month, as a number (78 for 78%).</td></tr>
<tr><td class='k'>LTRT</td><td>LTRT / DCRT attendance sheet (also in BNI Connect)</td><td>Attended / Not attended. If no LTRT or DCRT was scheduled that month, mark Attended so nobody is penalised.</td></tr>
<tr><td class='k'>New</td><td>BNI Connect new member report / payment records</td><td>New members whose payment was received <b>in that month</b>.</td></tr>
<tr><td class='k'>Renewals</td><td>Payment records</td><td>Renewals <b>paid in that month</b>, regardless of renewal date. (A 1 Nov renewal paid on 15 Oct counts in October.)</td></tr>
</table>
<p>Cells save when you leave them. Score, band, payout and rank update immediately. You may also override Online %, Offline % and 1-2-1 if an upload was wrong; the override is kept until the next upload of that report.</p>

<h3>Step 5: Review and publish</h3>
<ol>
<li>Every row must have a Member score, Retention %, LTRT and Jotform value. A blank counts as zero and will be questioned.</li>
<li>Check the region average and the band spread look sane against last month.</li>
<li>Click <b>Publish month</b>. SAs see it instantly. Payout figures are now frozen for that month.</li>
<li>Found a mistake after publishing? <b>Unpublish</b> → correct → <b>Publish</b> again. Tell the affected SA.</li>
</ol>
<div class='tip'><b>Time budget:</b> about 45 minutes a month once the four files are exported: 5 min uploads, 2 min Jotform, 25 min manual inputs, 10 min review.</div>

<h2 class='pb'>4. Users</h2>
<table class='data'>
<tr><th>Task</th><th>How</th></tr>
<tr><td class='k'>Reset an SA's PIN</td><td>Users → the SA → <b>Set PIN</b> (4 to 8 digits). Share it privately. All new SAs start on 1234 and must be reset before they get the link.</td></tr>
<tr><td class='k'>Fix the Jotform name</td><td>Users → <b>Jotform name</b>. Enter the name exactly as the SA types it on the visit form.</td></tr>
<tr><td class='k'>Replace a chapter's SA</td><td>Users → <b>Replace a chapter's SA</b>: chapter, new name, PIN, "from month". The old SA is deactivated (history kept), the new one starts fresh. Draft months from that month move to the new SA.</td></tr>
<tr><td class='k'>SA covers two chapters</td><td>Give the person a second login on the second chapter (Replace or Add). One person, two scorecards.</td></tr>
<tr><td class='k'>Add an admin</td><td>Users → <b>Add admin</b> (name, email, password of 8+ characters).</td></tr>
<tr><td class='k'>Deactivate / activate</td><td>Users → Deactivate. The person can no longer sign in; nothing is deleted.</td></tr>
</table>

<h2>5. Settings</h2>
<table class='data'>
<tr><th>Setting</th><th>Current</th><th>Notes</th></tr>
<tr><td class='k'>Membership fee</td><td>₹49,040</td><td>Per member, new or renewal. Change here when the team decides; draft months recalculate at once, published months keep their payout.</td></tr>
<tr><td class='k'>Commission %</td><td>2.5%</td><td>Per member: ₹1,226.</td></tr>
<tr><td class='k'>1-2-1 threshold</td><td>8.66 per member per month</td><td>= 2 per week × 4.33 weeks.</td></tr>
<tr><td class='k'>Mentoring KPI</td><td>Off</td><td>Turn on when the mentoring app provides the %. Score becomes out of 100.</td></tr>
<tr><td class='k'>Online training events</td><td>Admin-maintained list</td><td>Tick the event types that count as online. Everything else is offline. Only affects the split shown; the score uses the combined %.</td></tr>
<tr><td class='k'>Jotform form ID</td><td>261212882805052</td><td>BNI Chapter Visit Report.</td></tr>
</table>

<h2>6. Scoring reference</h2>
""" + SCORING_TABLE + BANDS_TABLE + """
<h3>Payout</h3>
""" + PAYOUT + """

<h2 class='pb'>7. Troubleshooting</h2>
<table class='data'>
<tr><th>Symptom</th><th>Cause and fix</th></tr>
<tr><td class='k'>"Report covers X to Y. Export one month at a time"</td><td>From and To span more than one month. Re-export with the same month in both.</td></tr>
<tr><td class='k'>"Not a BNI Connect export"</td><td>The file was opened and re-saved in Excel, or the wrong file was chosen. Download again from BNI Connect and upload the original.</td></tr>
<tr><td class='k'>Training shows 0% for a region</td><td>Chapter Statistics for that region wasn't uploaded first, so there is no member count. Upload it, then re-upload the training file.</td></tr>
<tr><td class='k'>"Month is already published"</td><td>Unpublish the month before re-uploading or syncing.</td></tr>
<tr><td class='k'>Jotform shows "no match"</td><td>Name mismatch. Fix the SA's Jotform name in Users, sync again, or set Done manually.</td></tr>
<tr><td class='k'>SA says "Wrong PIN"</td><td>Reset it in Users. Make sure they picked the right chapter on the login screen.</td></tr>
<tr><td class='k'>"Chapters not found in the app"</td><td>Chapter name changed in BNI Connect. Inform the ED; the chapter list is updated in Settings.</td></tr>
<tr><td class='k'>Anything else</td><td>Vercel project "bni-tnt-sa-scorecard" → Logs show the error. Send a screenshot to the ED.</td></tr>
</table>

<h2 class='pb'>9. The SDC month (Support Director Consultants)</h2>
<p>Switch the console to <b>SDC</b>. The SDC month is a separate page with its own publish button, but it shares the chapter list, the Chapter Statistics upload and the New / Renewals counts with the SA month.</p>
<h3>Step 1: Open the month</h3>
<p><b>First month only (October 2026):</b> open <b>September 2026</b> on the SDC switch (marked "baseline") and drop that month's Chapter Statistics for both regions. That gives October its starting member count. Do this once.</p>
<p>Months → pick the month → <b>Open month</b>. The app creates one row per chapter and the <b>weekly grid</b>: one cell per chapter meeting date (Ainthinai Tue, Bamboo Kottai Wed, Cmy Veli Thu, and so on; meeting days are in Settings).</p>
<h3>Step 2: Every Friday evening during the month</h3>
<ol>
<li>Click <b>Sync Jotform</b>. Tele-bridge submissions are matched to the meeting week by chapter and meeting date and ticked <b>TB ✓</b>. Future weeks stay blank.</li>
<li>In the weekly grid, tick <b>PALMS ✓</b> for every chapter whose PALMS came in on time this week, <b>PALMS ✗</b> for the rest. Keep the PALMS screenshot in the office records as proof.</li>
<li>If a chapter did not meet this week (holiday), click <b>no meeting</b> under that cell. The week drops out of both denominators.</li>
<li>A wrong automatic tick can be clicked to change it; manual ticks survive later syncs.</li>
</ol>
<h3>Step 3: First week of the next month</h3>
<table class='data'>
<tr><th>Column</th><th>Source</th><th>Rule</th></tr>
<tr><td class='k'>Net add</td><td>Chapter Statistics upload (both regions), this month minus last month</td><td>Filled automatically once both months have a member count. Type a number to override with the exact joiners-minus-leavers; clear the cell to go back to the derived figure.</td></tr>
<tr><td class='k'>Traffic light</td><td>Upload the <b>All India Chapter Traffic Lights</b> .xlsx on the SDC month page</td><td>GREEN / AMBER / RED per chapter is read from the file (chapter score shown under it). Pick a value by hand to override.</td></tr>
<tr><td class='k'>Renewal %</td><td>3+1 Traffic Lights report</td><td>Chapter's <b>overall</b> retention % as published (82 for 82%). Leave blank only if the report has no figure.</td></tr>
<tr><td class='k'>Member score</td><td>Monthly Member Traffic Light report</td><td>The SDC's own score as a member.</td></tr>
<tr><td class='k'>Visit 24h</td><td>Sync Jotform</td><td>Done only if the SDC's Chapter Visit Report was submitted on the visit day or the next day. The sync shows late submissions; override by hand if the office accepts a reason.</td></tr>
<tr><td class='k'>LTRT</td><td>Attendance sheet</td><td>Attended / Not attended.</td></tr>
<tr><td class='k'>Paid</td><td>Read-only</td><td>New + Renewals typed on the <b>SA</b> month for the same chapter. Enter them there once; both payouts use them.</td></tr>
</table>
<p>The Chapter Statistics upload can be dropped on either month page; it updates both programmes. If the SA month is already published, only the SDC member counts are updated.</p>
<h3>Step 4: Review and publish</h3>
<ol>
<li>No week should be left unticked ("4 unticked" under TB or PALMS means the grid is incomplete; a blank week scores 0).</li>
<li>Every row needs a Traffic light, Renewal %, Member score, Visit and LTRT value.</li>
<li><b>Publish month</b>. SDCs see it instantly. Unpublish → fix → Publish to correct.</li>
</ol>
<h3>SDC users and settings</h3>
<ul>
<li>Users page has a <b>Support Director Consultants</b> table with the same Set PIN, Jotform name, Replace and Deactivate actions as SAs. The Jotform name is matched against "Visited By" on the visit form.</li>
<li>Settings: <b>SDC commission %</b> (7.5% at launch, ₹3,678 per member paid), <b>Tele-bridge form ID</b> (221121498823050) and <b>chapter meeting days</b>.</li>
</ul>
<h3>SDC scoring reference</h3>
""" + SDC_SCORING_TABLE + SDC_PAYOUT + """

<h2>10. Data rules worth remembering</h2>
<ul>
<li>Training counts <b>unique members</b>. A member attending three workshops counts once.</li>
<li>1-2-1 is per member per <b>month</b>, straight from BNI Connect. The old sheet's "2 per week" entries were never real; do not type a number by hand unless the upload failed.</li>
<li>Payout counts members by <b>payment month</b>, not by renewal date.</li>
<li>History belongs to the person, not the chapter. A new SA starts with a blank history.</li>
<li>The Google Sheet is now an archive. The app is the record.</li>
<li><b>Go-live is October 2026</b> for both programmes. Earlier months are not scored or shown. September 2026 exists only as a <b>baseline</b>: upload its Chapter Statistics (both regions) once so October net growth has a starting point. A baseline month cannot be published.</li>
<li>SDC net growth is <b>monthly</b> (this month's count minus last month's), not the trailing "Growth" figure printed on the Traffic Lights report.</li>
<li>Tele-bridge weeks are matched by the <b>meeting date</b> typed on the form, not by the date the form was submitted.</li>
</ul>
<div class='footer'>BNI TNT Region · SA &amp; SDC Scorecard Admin Guide v1.1 · Owner Mohamed Riaz · https://sa.bnitnt.in</div>
"""

(OUT / "SA_Scorecard_Guide_for_Support_Ambassadors.html").write_text(page("SA Scorecard Guide", sa_body), encoding="utf-8")
(OUT / "SA_Scorecard_Admin_Guide.html").write_text(page("SA & SDC Scorecard Admin Guide", admin_body), encoding="utf-8")
(OUT / "SDC_Scorecard_Guide_for_Support_DCs.html").write_text(page("SDC Scorecard Guide", sdc_body), encoding="utf-8")
print("html written")
