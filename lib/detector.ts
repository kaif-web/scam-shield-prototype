export type RiskLevel = 'safe' | 'suspicious' | 'high' | 'critical'
export type Analysis = { score:number; level:RiskLevel; categories:string[]; reasons:{signal:string; weight:number; explanation:string; explanationHi:string; snippet:string}[]; suggestedActions:string[]; detectedLinks:string[] }
const rules = [
 {category:'Digital arrest / fake authority', weight:34, patterns:[/digital arrest|cyber crime|money laundering|arrest warrant|stay on (the )?call|do not tell anyone|किसी को मत बताना|गिरफ्तार|giraftaar|cbi|ed officer|customs|ncb|drugs found/i]},
 {category:'Fake KYC / bank / card', weight:24, patterns:[/kyc.{0,18}(expire|update| बंद|band)|account.{0,18}(block| बंद)|pan|aadhaar|aadhar|sim.{0,12}block|credit card.{0,18}points|केवाईसी|खाता बंद/i]},
 {category:'OTP / UPI / remote access', weight:30, patterns:[/share.{0,12}(otp|pin)|otp.{0,12}(share|बताएं)|upi.{0,18}(pin|collect|request)|scan.{0,15}(receive|पैसे)|anydesk|teamviewer|quicksupport|ओटीपी|यूपीआई पिन/i]},
 {category:'Parcel / courier / customs', weight:22, patterns:[/parcel|courier|customs|fedex|dhl|drugs.{0,15}parcel|पार्सल|कूरियर/i]},
 {category:'Utility disconnection', weight:22, patterns:[/electricity|बिजली|gas bill|बिल.{0,12}(काट|बंद)|disconnec(t|tion)|मीटर/i]},
 {category:'Lottery / prize', weight:22, patterns:[/lottery|prize|winner|kbc|gift.{0,12}(voucher|हैम्पर)|लॉटरी|इनाम/i]},
 {category:'Job / investment scam', weight:26, patterns:[/guaranteed returns|double your money|crypto|investment|part.?time task|telegram job|work from home.{0,20}(earn|पैसे)|निवेश|गारंटीड रिटर्न/i]},
 {category:'Malicious app / file', weight:32, patterns:[/\.apk\b|install this app|update app|रिमोट ऐप|ऐप इंस्टॉल/i]},
]
const signals = [
 {signal:'Urgency', weight:14, pattern:/immediately|within \d+ minutes|urgent|abhi|turant|तुरंत|अभी/i, explanation:'The message pressures you to act immediately.', explanationHi:'यह संदेश तुरंत कार्रवाई का दबाव बनाता है।'},
 {signal:'Money or sensitive data request', weight:22, pattern:/(send|pay|transfer|share|provide|भेजें|दो|बताएं).{0,25}(money|paise|रुपये|otp|pin|password|account|पैसे|ओटीपी)/i, explanation:'It asks for money or sensitive information.', explanationHi:'यह पैसे या संवेदनशील जानकारी मांगता है।'},
 {signal:'Secrecy / isolation', weight:18, pattern:/do not tell|don't tell|kisi ko mat|किसी को मत|secret|गुप्त/i, explanation:'Scammers isolate victims from people who could help.', explanationHi:'ठग आपको मदद करने वालों से दूर रखना चाहता है।'},
 {signal:'Threat or fear', weight:16, pattern:/arrest|legal action|police case|blocked|disconnect|बंद|गिरफ्तार|कानूनी कार्रवाई/i, explanation:'Threats and fear are common scam pressure tactics.', explanationHi:'धमकी और डर ठगी के आम दबाव वाले तरीके हैं।'},
]
export function analyzeText(input:string):Analysis { const text=input.normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g,'').replace(/(.)\1{3,}/g,'$1$1$1'); const reasons:any[]=[]; const categories:string[]=[]; for(const rule of rules){const hit=rule.patterns.find(p=>p.test(text)); if(hit){categories.push(rule.category); reasons.push({signal:rule.category,weight:rule.weight,explanation:`This matches a known ${rule.category.toLowerCase()} pattern.`,explanationHi:`यह ${rule.category} से जुड़ा पैटर्न है।`,snippet:text.match(hit)?.[0]??''})}} for(const s of signals){if(s.pattern.test(text)) reasons.push({...s,snippet:text.match(s.pattern)?.[0]??''})} const urls=[...(text.match(/https?:\/\/[^\s]+|\b\S+\.(?:in|com|net|cc|top|xyz)\b/gi)??[])]; let bonus=urls.length?10:0; if(/bit\.ly|tinyurl|t\.co|\.apk\b|\d{1,3}(?:\.\d{1,3}){3}/i.test(text)) { bonus+=18; reasons.push({signal:'Suspicious link',weight:18,explanation:'The link may redirect to an unsafe destination.',explanationHi:'यह लिंक असुरक्षित जगह पर ले जा सकता है।',snippet:urls[0]??''}) } const raw=reasons.reduce((a,r)=>a+r.weight,0)+bonus; const score=Math.min(100,Math.round(100*(1-Math.exp(-raw/85)))); let level:RiskLevel=score>=82?'critical':score>=62?'high':score>=32?'suspicious':'safe'; if(!categories.length && !reasons.length) level='safe'; return {score,level,categories:[...new Set(categories)],reasons,suggestedActions:level==='safe'?['No action needed.','Never share an OTP, even with someone claiming to help.']:['Do not share OTP, PIN, or passwords.','Hang up and verify using an official number.','Report financial fraud quickly on 1930.'],detectedLinks:urls} }
export const samples=[
 ['Digital arrest (Hinglish)','CBI se bol raha hoon. Aapke parcel me drugs mile hain. Digital arrest hoga, kisi ko mat batana, video call par raho aur paise turant bhejo.'],['KYC (Hindi)','आपका KYC समाप्त हो गया है। खाता बंद होने से बचाने के लिए लिंक खोलकर OTP और PAN अपडेट करें।'],['Electricity','Your electricity connection will be disconnected today. Pay immediately using this link.'],['Courier','Customs department found illegal drugs in your parcel. Pay the clearance fee now.'],['APK','RTO challan pending. Install this APK to view and pay your fine.'],['Investment','Join our Telegram task job. Guaranteed returns and double money today.'],['Safe greeting','Hi, call me when you are free.'],['Safe OTP','Your OTP is 123456. Do not share it with anyone.']
]
export function maskSnippet(text:string){return text.slice(0,120).replace(/\b\d{4,}\b/g,'****').replace(/https?:\/\/\S+/gi,'[link masked]')}
export function highlightTerms(text:string){return text}
export const detectorTestMessages = samples
if(typeof window==='undefined') { /* browser-only analyzer; no network calls */ }
export default analyzeText
export function extractLinks(text:string){return [...(text.match(/https?:\/\/[^\s]+/gi)??[])]}
export const safeExamples=['Hi, call me when you are free','Your OTP is 123456, do not share','Meeting moved to 5pm.']
export const analyze = analyzeText
export const detectorVersion='1.0.0'
